import os
import uuid

from django.core.files.storage import default_storage
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.mongo import Collections, col
from core.permissions import IsAdmin, IsAuthenticated
from core.purchases import has_purchased
from core.utils import serialize_doc, to_object_id

from .serializers import ProjectSerializer


class ProjectListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [AllowAny()]

    def get(self, request):
        q = request.query_params
        query = {}
        if q.get("search"):
            query["$or"] = [
                {"title_ar": {"$regex": q["search"], "$options": "i"}},
                {"title_en": {"$regex": q["search"], "$options": "i"}},
            ]
        docs = list(col(Collections.PROJECTS).find(query).sort("_id", -1))
        out = []
        for d in docs:
            item = serialize_doc(d)
            item["is_purchased"] = bool(
                getattr(request.user, "is_authenticated", False)
                and has_purchased(to_object_id(request.user.id), "project", d["_id"])
            )
            out.append(item)
        return Response(out)

    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        data["thumbnail"] = None
        data["file_path"] = None
        result = col(Collections.PROJECTS).insert_one(data)
        return Response(serialize_doc(col(Collections.PROJECTS).find_one({"_id": result.inserted_id})), status=201)


class ProjectDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdmin()]

    def get(self, request, project_id):
        doc = col(Collections.PROJECTS).find_one({"_id": to_object_id(project_id)})
        if not doc:
            raise NotFound("Project not found.")
        item = serialize_doc(doc)
        item["is_purchased"] = bool(
            getattr(request.user, "is_authenticated", False)
            and has_purchased(to_object_id(request.user.id), "project", doc["_id"])
        )
        return Response(item)

    def put(self, request, project_id):
        serializer = ProjectSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        oid = to_object_id(project_id)
        col(Collections.PROJECTS).update_one({"_id": oid}, {"$set": serializer.validated_data})
        return Response(serialize_doc(col(Collections.PROJECTS).find_one({"_id": oid})))

    def delete(self, request, project_id):
        col(Collections.PROJECTS).delete_one({"_id": to_object_id(project_id)})
        return Response(status=204)


class ProjectFileUploadView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, project_id):
        oid = to_object_id(project_id)
        project = col(Collections.PROJECTS).find_one({"_id": oid})
        if not project:
            raise NotFound("Project not found.")
        update = {}
        if "file" in request.FILES:
            file = request.FILES["file"]
            path = default_storage.save(f"projects/{uuid.uuid4().hex}{os.path.splitext(file.name)[1]}", file)
            update["file_path"] = f"/media/{path}"
        if "thumbnail" in request.FILES:
            thumb = request.FILES["thumbnail"]
            path = default_storage.save(
                f"thumbnails/{uuid.uuid4().hex}{os.path.splitext(thumb.name)[1]}", thumb
            )
            update["thumbnail"] = f"/media/{path}"
        if not update:
            raise ValidationError({"detail": "No file uploaded."})
        col(Collections.PROJECTS).update_one({"_id": oid}, {"$set": update})
        return Response(serialize_doc(col(Collections.PROJECTS).find_one({"_id": oid})))


class ProjectDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        oid = to_object_id(project_id)
        project = col(Collections.PROJECTS).find_one({"_id": oid})
        if not project:
            raise NotFound("Project not found.")
        if not has_purchased(to_object_id(request.user.id), "project", oid):
            raise PermissionDenied("Purchase this project to download it.")
        if not project.get("file_path"):
            raise NotFound("No file uploaded for this project yet.")
        return Response({"file_path": project["file_path"]})
