import os
import uuid
from datetime import datetime, timezone

from django.core.files.storage import default_storage
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.mongo import Collections, col
from core.permissions import IsAdmin, IsAuthenticated, IsInstructorOrAdmin
from core.utils import serialize_doc, serialize_many, to_object_id

from .serializers import (
    CategorySerializer,
    CourseSerializer,
    CurriculumSerializer,
    PathSerializer,
    ReviewSerializer,
)


def now():
    return datetime.now(timezone.utc)


def get_or_404(collection, oid):
    doc = col(collection).find_one({"_id": to_object_id(oid)})
    if not doc:
        raise NotFound("Not found.")
    return doc


def enrich_course(doc: dict, user=None) -> dict:
    out = serialize_doc(doc)
    instructor = col(Collections.USERS).find_one({"_id": doc.get("instructor_id")})
    category = col(Collections.CATEGORIES).find_one({"_id": doc.get("category_id")})
    out["instructor"] = (
        {"id": str(instructor["_id"]), "name": instructor["name"], "avatar": instructor.get("avatar")}
        if instructor
        else None
    )
    out["category"] = serialize_doc(category)
    out["lesson_count"] = col(Collections.LESSONS).count_documents({"course_id": doc["_id"]})
    out["student_count"] = col(Collections.ENROLLMENTS).count_documents({"course_id": doc["_id"]})
    if user and getattr(user, "is_authenticated", False):
        enrollment = col(Collections.ENROLLMENTS).find_one(
            {"user_id": to_object_id(user.id), "course_id": doc["_id"]}
        )
        out["is_enrolled"] = enrollment is not None
        out["progress"] = enrollment.get("progress", 0) if enrollment else 0
    else:
        out["is_enrolled"] = False
        out["progress"] = 0
    return out


# ---- Categories ----


class CategoryListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [AllowAny()]

    def get(self, request):
        docs = list(col(Collections.CATEGORIES).find().sort("name_en", 1))
        return Response(serialize_many(docs))

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = col(Collections.CATEGORIES).insert_one(serializer.validated_data)
        doc = col(Collections.CATEGORIES).find_one({"_id": result.inserted_id})
        return Response(serialize_doc(doc), status=201)


class CategoryDetailView(APIView):
    permission_classes = [IsAdmin]

    def put(self, request, category_id):
        serializer = CategorySerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        oid = to_object_id(category_id)
        col(Collections.CATEGORIES).update_one({"_id": oid}, {"$set": serializer.validated_data})
        return Response(serialize_doc(col(Collections.CATEGORIES).find_one({"_id": oid})))

    def delete(self, request, category_id):
        col(Collections.CATEGORIES).delete_one({"_id": to_object_id(category_id)})
        return Response(status=204)


# ---- Paths / Tracks ----


class PathListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [AllowAny()]

    def get(self, request):
        docs = list(col(Collections.PATHS).find())
        out = []
        for d in docs:
            item = serialize_doc(d)
            item["course_count"] = col(Collections.COURSES).count_documents(
                {"_id": {"$in": d.get("course_ids", [])}}
            )
            out.append(item)
        return Response(out)

    def post(self, request):
        serializer = PathSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        data["course_ids"] = [to_object_id(c) for c in data.get("course_ids", [])]
        result = col(Collections.PATHS).insert_one(data)
        return Response(serialize_doc(col(Collections.PATHS).find_one({"_id": result.inserted_id})), status=201)


class PathDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdmin()]

    def get(self, request, path_id):
        doc = get_or_404(Collections.PATHS, path_id)
        out = serialize_doc(doc)
        courses = list(col(Collections.COURSES).find({"_id": {"$in": doc.get("course_ids", [])}}))
        out["courses"] = [enrich_course(c, request.user) for c in courses]
        return Response(out)

    def put(self, request, path_id):
        serializer = PathSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        if "course_ids" in data:
            data["course_ids"] = [to_object_id(c) for c in data["course_ids"]]
        oid = to_object_id(path_id)
        col(Collections.PATHS).update_one({"_id": oid}, {"$set": data})
        return Response(serialize_doc(col(Collections.PATHS).find_one({"_id": oid})))

    def delete(self, request, path_id):
        col(Collections.PATHS).delete_one({"_id": to_object_id(path_id)})
        return Response(status=204)


# ---- Courses ----


class CourseListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsInstructorOrAdmin()]
        return [AllowAny()]

    def get(self, request):
        q = request.query_params
        query = {}
        is_admin = getattr(request.user, "is_authenticated", False) and request.user.role == "admin"
        if q.get("mine") == "true" and getattr(request.user, "is_authenticated", False):
            query["instructor_id"] = to_object_id(request.user.id)
        elif q.get("all") == "true" and is_admin:
            pass
        else:
            query["status"] = "published"
        if q.get("category_id"):
            query["category_id"] = to_object_id(q["category_id"])
        if q.get("path_id"):
            query["path_id"] = to_object_id(q["path_id"])
        if q.get("level"):
            query["level"] = q["level"]
        if q.get("language"):
            query["language"] = q["language"]
        if q.get("is_free") == "true":
            query["is_free"] = True
        elif q.get("is_free") == "false":
            query["is_free"] = False
        if q.get("search"):
            query["$or"] = [
                {"title_ar": {"$regex": q["search"], "$options": "i"}},
                {"title_en": {"$regex": q["search"], "$options": "i"}},
            ]

        sort_field, sort_dir = "created_at", -1
        if q.get("sort") == "price_asc":
            sort_field, sort_dir = "price", 1
        elif q.get("sort") == "price_desc":
            sort_field, sort_dir = "price", -1
        elif q.get("sort") == "rating":
            sort_field, sort_dir = "rating_avg", -1

        page = max(int(q.get("page", 1)), 1)
        page_size = min(int(q.get("page_size", 12)), 50)

        cursor = col(Collections.COURSES).find(query).sort(sort_field, sort_dir)
        total = col(Collections.COURSES).count_documents(query)
        docs = list(cursor.skip((page - 1) * page_size).limit(page_size))

        return Response(
            {
                "results": [enrich_course(d, request.user) for d in docs],
                "total": total,
                "page": page,
                "page_size": page_size,
            }
        )

    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        data["category_id"] = to_object_id(data["category_id"])
        data["path_id"] = to_object_id(data["path_id"]) if data.get("path_id") else None
        data["instructor_id"] = to_object_id(request.user.id)
        data["rating_avg"] = 0
        data["rating_count"] = 0
        data["exam"] = {"questions": []}
        data["created_at"] = now()
        result = col(Collections.COURSES).insert_one(data)
        doc = col(Collections.COURSES).find_one({"_id": result.inserted_id})
        return Response(enrich_course(doc, request.user), status=201)


class CourseDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsInstructorOrAdmin()]

    def get(self, request, course_id):
        doc = get_or_404(Collections.COURSES, course_id)
        out = enrich_course(doc, request.user)
        modules = list(col(Collections.MODULES).find({"course_id": doc["_id"]}).sort("order", 1))
        can_see_all = out["is_enrolled"] or (
            getattr(request.user, "is_authenticated", False)
            and (request.user.role == "admin" or str(doc["instructor_id"]) == request.user.id)
        )
        out_modules = []
        for m in modules:
            lessons = list(
                col(Collections.LESSONS).find({"module_id": m["_id"]}).sort("order", 1)
            )
            lesson_out = []
            for lesson in lessons:
                item = serialize_doc(lesson)
                locked = not (can_see_all or lesson.get("is_preview"))
                if locked:
                    item["content"] = None
                    item["video_url"] = None
                    item["video_file_path"] = None
                item["locked"] = locked
                lesson_out.append(item)
            module_out = serialize_doc(m)
            module_out["lessons"] = lesson_out
            out_modules.append(module_out)
        out["modules"] = out_modules
        return Response(out)

    def put(self, request, course_id):
        doc = get_or_404(Collections.COURSES, course_id)
        _check_owner(request, doc)
        serializer = CourseSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        if "category_id" in data:
            data["category_id"] = to_object_id(data["category_id"])
        if "path_id" in data:
            data["path_id"] = to_object_id(data["path_id"]) if data["path_id"] else None
        col(Collections.COURSES).update_one({"_id": doc["_id"]}, {"$set": data})
        return Response(enrich_course(col(Collections.COURSES).find_one({"_id": doc["_id"]}), request.user))

    def delete(self, request, course_id):
        doc = get_or_404(Collections.COURSES, course_id)
        _check_owner(request, doc)
        col(Collections.COURSES).delete_one({"_id": doc["_id"]})
        col(Collections.MODULES).delete_many({"course_id": doc["_id"]})
        col(Collections.LESSONS).delete_many({"course_id": doc["_id"]})
        return Response(status=204)


def _check_owner(request, course_doc):
    if request.user.role == "admin":
        return
    if str(course_doc["instructor_id"]) != request.user.id:
        raise PermissionDenied("You do not own this course.")


class CourseCurriculumView(APIView):
    permission_classes = [IsInstructorOrAdmin]

    def get(self, request, course_id):
        doc = get_or_404(Collections.COURSES, course_id)
        _check_owner(request, doc)
        modules = list(col(Collections.MODULES).find({"course_id": doc["_id"]}).sort("order", 1))
        out_modules = []
        for m in modules:
            lessons = list(col(Collections.LESSONS).find({"module_id": m["_id"]}).sort("order", 1))
            module_out = serialize_doc(m)
            module_out["lessons"] = serialize_many(lessons)
            out_modules.append(module_out)
        return Response({"course": serialize_doc(doc), "modules": out_modules})

    def put(self, request, course_id):
        doc = get_or_404(Collections.COURSES, course_id)
        _check_owner(request, doc)
        serializer = CurriculumSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        col(Collections.LESSONS).delete_many({"course_id": doc["_id"]})
        col(Collections.MODULES).delete_many({"course_id": doc["_id"]})

        module_temp_map = {}
        for idx, m in enumerate(request.data.get("modules", [])):
            result = col(Collections.MODULES).insert_one(
                {
                    "course_id": doc["_id"],
                    "title_ar": m["title_ar"],
                    "title_en": m["title_en"],
                    "order": m.get("order", idx + 1),
                }
            )
            module_temp_map[m.get("temp_id", str(idx))] = result.inserted_id

        for lesson in request.data.get("lessons", []):
            module_ref = lesson.get("module_temp_id") or lesson.get("module_id")
            module_oid = module_temp_map.get(module_ref) or (
                to_object_id(module_ref) if module_ref else None
            )
            if not module_oid:
                continue
            col(Collections.LESSONS).insert_one(
                {
                    "module_id": module_oid,
                    "course_id": doc["_id"],
                    "title_ar": lesson["title_ar"],
                    "title_en": lesson["title_en"],
                    "content": lesson.get("content", ""),
                    "video_type": lesson.get("video_type", "youtube"),
                    "video_url": lesson.get("video_url"),
                    "video_file_path": lesson.get("video_file_path"),
                    "order": lesson.get("order", 1),
                    "duration": lesson.get("duration", 0),
                    "is_preview": lesson.get("is_preview", False),
                }
            )

        if "exam" in data:
            col(Collections.COURSES).update_one(
                {"_id": doc["_id"]}, {"$set": {"exam": data["exam"], "has_exam": True}}
            )

        return self.get(request, course_id)


class LessonVideoUploadView(APIView):
    permission_classes = [IsInstructorOrAdmin]

    def post(self, request, lesson_id):
        lesson = get_or_404(Collections.LESSONS, lesson_id)
        course = get_or_404(Collections.COURSES, str(lesson["course_id"]))
        _check_owner(request, course)
        file = request.FILES.get("video")
        if not file:
            raise ValidationError({"video": "No file uploaded."})
        ext = os.path.splitext(file.name)[1]
        filename = f"videos/{uuid.uuid4().hex}{ext}"
        path = default_storage.save(filename, file)
        url = f"/media/{path}"
        col(Collections.LESSONS).update_one(
            {"_id": lesson["_id"]},
            {"$set": {"video_type": "upload", "video_file_path": url, "video_url": None}},
        )
        return Response({"video_file_path": url})


# ---- Reviews ----


class CourseReviewsView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, course_id):
        docs = list(
            col(Collections.REVIEWS).find({"course_id": to_object_id(course_id)}).sort(
                "created_at", -1
            )
        )
        out = []
        for d in docs:
            item = serialize_doc(d)
            user = col(Collections.USERS).find_one({"_id": d["user_id"]})
            item["user"] = {"name": user["name"], "avatar": user.get("avatar")} if user else None
            out.append(item)
        return Response(out)

    def post(self, request, course_id):
        course_oid = to_object_id(course_id)
        enrollment = col(Collections.ENROLLMENTS).find_one(
            {"user_id": to_object_id(request.user.id), "course_id": course_oid}
        )
        if not enrollment:
            raise PermissionDenied("You must be enrolled to review this course.")
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        data["course_id"] = course_oid
        data["user_id"] = to_object_id(request.user.id)
        data["created_at"] = now()

        col(Collections.REVIEWS).update_one(
            {"course_id": course_oid, "user_id": data["user_id"]}, {"$set": data}, upsert=True
        )

        agg = list(
            col(Collections.REVIEWS).aggregate(
                [
                    {"$match": {"course_id": course_oid}},
                    {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
                ]
            )
        )
        if agg:
            col(Collections.COURSES).update_one(
                {"_id": course_oid},
                {"$set": {"rating_avg": round(agg[0]["avg"], 2), "rating_count": agg[0]["count"]}},
            )
        return Response(serialize_doc(data), status=201)
