from datetime import datetime, timezone

from pymongo.errors import DuplicateKeyError
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from core.mongo import Collections, col
from core.permissions import IsAuthenticated, IsInstructorOrAdmin
from core.utils import serialize_doc, serialize_many, to_object_id

from .gamification import COURSE_COMPLETE_XP, LESSON_XP, award_xp
from .serializers import (
    AnnouncementSerializer,
    CompleteLessonSerializer,
    EnrollSerializer,
    SubmitExamSerializer,
)


def now():
    return datetime.now(timezone.utc)


class EnrollView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = EnrollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        course_oid = to_object_id(data["course_id"])
        course = col(Collections.COURSES).find_one({"_id": course_oid})
        if not course:
            raise NotFound("Course not found.")

        user_oid = to_object_id(request.user.id)
        payment_oid = None
        if not course.get("is_free"):
            if not data.get("payment_id"):
                raise PermissionDenied("This course requires payment before enrolling.")
            payment_oid = to_object_id(data["payment_id"])
            payment = col(Collections.PAYMENTS).find_one(
                {"_id": payment_oid, "user_id": user_oid, "status": "succeeded", "ref_id": course_oid}
            )
            if not payment:
                raise PermissionDenied("Payment not confirmed for this course.")

        try:
            col(Collections.ENROLLMENTS).insert_one(
                {
                    "user_id": user_oid,
                    "course_id": course_oid,
                    "progress": 0,
                    "completed": False,
                    "enrolled_at": now(),
                    "completion_date": None,
                    "payment_id": payment_oid,
                }
            )
        except DuplicateKeyError:
            pass

        return Response({"detail": "Enrolled."}, status=201)


class MyEnrollmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_oid = to_object_id(request.user.id)
        enrollments = list(col(Collections.ENROLLMENTS).find({"user_id": user_oid}).sort("enrolled_at", -1))
        out = []
        for e in enrollments:
            item = serialize_doc(e)
            course = col(Collections.COURSES).find_one({"_id": e["course_id"]})
            item["course"] = serialize_doc(course)
            out.append(item)
        return Response(out)


class CompleteLessonView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CompleteLessonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lesson_oid = to_object_id(serializer.validated_data["lesson_id"])
        lesson = col(Collections.LESSONS).find_one({"_id": lesson_oid})
        if not lesson:
            raise NotFound("Lesson not found.")

        user_oid = to_object_id(request.user.id)
        course_oid = lesson["course_id"]
        enrollment = col(Collections.ENROLLMENTS).find_one({"user_id": user_oid, "course_id": course_oid})
        if not enrollment:
            raise PermissionDenied("You are not enrolled in this course.")

        newly_completed = False
        try:
            col(Collections.LESSON_COMPLETIONS).insert_one(
                {"user_id": user_oid, "lesson_id": lesson_oid, "completed_at": now()}
            )
            newly_completed = True
        except DuplicateKeyError:
            pass

        total_lessons = col(Collections.LESSONS).count_documents({"course_id": course_oid})
        done_lesson_ids = [
            d["lesson_id"]
            for d in col(Collections.LESSON_COMPLETIONS).find({"user_id": user_oid})
        ]
        done_count = col(Collections.LESSONS).count_documents(
            {"course_id": course_oid, "_id": {"$in": done_lesson_ids}}
        )
        progress = round((done_count / total_lessons) * 100) if total_lessons else 0

        course = col(Collections.COURSES).find_one({"_id": course_oid})
        needs_exam = bool(course.get("has_exam")) and not enrollment.get("exam_passed")

        update = {"progress": progress}
        course_just_completed = False
        if progress >= 100 and not enrollment.get("completed") and not needs_exam:
            update["completed"] = True
            update["completion_date"] = now()
            course_just_completed = True

        col(Collections.ENROLLMENTS).update_one({"_id": enrollment["_id"]}, {"$set": update})

        if newly_completed:
            award_xp(user_oid, LESSON_XP, "lesson_complete")
        if course_just_completed:
            _mark_course_complete(user_oid, course_oid, course)

        return Response(
            {
                "progress": progress,
                "completed": progress >= 100 and not needs_exam,
                "needs_exam": progress >= 100 and needs_exam,
            }
        )


def _mark_course_complete(user_oid, course_oid, course):
    award_xp(user_oid, COURSE_COMPLETE_XP, "course_complete")
    title_ar = course.get("title_ar") if course else ""
    col(Collections.NOTIFICATIONS).insert_one(
        {
            "user_id": user_oid,
            "title": "تهانينا! أكملت الكورس",
            "message": f"لقد أكملت كورس {title_ar} بنجاح. يمكنك الآن طلب الشهادة.",
            "type": "course_complete",
            "course_id": course_oid,
            "is_read": False,
            "created_at": now(),
        }
    )


class SubmitExamView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SubmitExamSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        course_oid = to_object_id(data["course_id"])
        course = col(Collections.COURSES).find_one({"_id": course_oid})
        if not course:
            raise NotFound("Course not found.")

        user_oid = to_object_id(request.user.id)
        enrollment = col(Collections.ENROLLMENTS).find_one({"user_id": user_oid, "course_id": course_oid})
        if not enrollment:
            raise PermissionDenied("You are not enrolled in this course.")

        questions = course.get("exam", {}).get("questions", [])
        answers = data["answers"]
        correct = sum(
            1
            for i, q in enumerate(questions)
            if i < len(answers) and answers[i] == q.get("correct_index")
        )
        score = round((correct / len(questions)) * 100) if questions else 100
        passed = score >= 60

        update = {"exam_score": score, "exam_passed": passed}
        just_completed = False
        if passed and enrollment.get("progress", 0) >= 100 and not enrollment.get("completed"):
            update["completed"] = True
            update["completion_date"] = now()
            just_completed = True

        col(Collections.ENROLLMENTS).update_one({"_id": enrollment["_id"]}, {"$set": update})

        if just_completed:
            _mark_course_complete(user_oid, course_oid, course)

        return Response({"score": score, "passed": passed})


class LeaderboardView(APIView):
    permission_classes = []

    def get(self, request):
        docs = list(col(Collections.USERS).find({"role": "student"}).sort("xp", -1).limit(20))
        out = [
            {
                "id": str(d["_id"]),
                "name": d["name"],
                "avatar": d.get("avatar"),
                "xp": d.get("xp", 0),
                "level": d.get("level", 1),
                "streak": d.get("streak", 0),
            }
            for d in docs
        ]
        return Response(out)


class AnnounceCourseView(APIView):
    permission_classes = [IsInstructorOrAdmin]

    def post(self, request, course_id):
        course = col(Collections.COURSES).find_one({"_id": to_object_id(course_id)})
        if not course:
            raise NotFound("Course not found.")
        if request.user.role != "admin" and str(course["instructor_id"]) != request.user.id:
            raise PermissionDenied("You do not own this course.")

        serializer = AnnouncementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        col(Collections.ANNOUNCEMENTS).insert_one(
            {
                "instructor_id": to_object_id(request.user.id),
                "course_id": course["_id"],
                "title": data["title"],
                "message": data["message"],
                "created_at": now(),
            }
        )

        student_ids = [
            e["user_id"] for e in col(Collections.ENROLLMENTS).find({"course_id": course["_id"]})
        ]
        if student_ids:
            col(Collections.NOTIFICATIONS).insert_many(
                [
                    {
                        "user_id": sid,
                        "title": data["title"],
                        "message": data["message"],
                        "type": "announcement",
                        "course_id": course["_id"],
                        "is_read": False,
                        "created_at": now(),
                    }
                    for sid in student_ids
                ]
            )
        return Response({"detail": "Announcement sent.", "recipients": len(student_ids)}, status=201)


class InstructorSummaryView(APIView):
    permission_classes = [IsInstructorOrAdmin]

    def get(self, request):
        instructor_oid = to_object_id(request.user.id)
        course_ids = [
            c["_id"] for c in col(Collections.COURSES).find({"instructor_id": instructor_oid}, {"_id": 1})
        ]
        total_students = len(
            col(Collections.ENROLLMENTS).distinct("user_id", {"course_id": {"$in": course_ids}})
        )
        payments = list(
            col(Collections.PAYMENTS).find(
                {"ref_id": {"$in": course_ids}, "type": "course", "status": "succeeded"}
            )
        )
        total_revenue = sum(float(p.get("amount", 0)) for p in payments)
        return Response(
            {
                "total_courses": len(course_ids),
                "total_students": total_students,
                "total_revenue": total_revenue,
            }
        )
