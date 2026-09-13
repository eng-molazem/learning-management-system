from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from core.mongo import Collections, col
from core.permissions import IsAdmin, IsAuthenticated
from core.utils import serialize_doc, serialize_many, to_object_id


class MyCertificatesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        docs = list(
            col(Collections.CERTIFICATES).find({"user_id": to_object_id(request.user.id)}).sort(
                "issued_at", -1
            )
        )
        out = []
        for d in docs:
            item = serialize_doc(d)
            course = col(Collections.COURSES).find_one({"_id": d["course_id"]})
            item["course"] = serialize_doc(course)
            out.append(item)
        return Response(out)


class VerifyCertificateView(APIView):
    permission_classes = []

    def get(self, request, code):
        doc = col(Collections.CERTIFICATES).find_one({"certificate_code": code})
        if not doc:
            raise NotFound("Certificate not found.")
        user = col(Collections.USERS).find_one({"_id": doc["user_id"]})
        course = col(Collections.COURSES).find_one({"_id": doc["course_id"]})
        out = serialize_doc(doc)
        out["student_name"] = user["name"] if user else None
        out["course"] = serialize_doc(course)
        return Response(out)


class AdminCertificatesView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        docs = list(col(Collections.CERTIFICATES).find().sort("issued_at", -1))
        out = []
        for d in docs:
            item = serialize_doc(d)
            user = col(Collections.USERS).find_one({"_id": d["user_id"]})
            course = col(Collections.COURSES).find_one({"_id": d["course_id"]})
            item["user"] = {"name": user["name"], "email": user["email"]} if user else None
            item["course"] = serialize_doc(course)
            out.append(item)
        return Response(out)
