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
from core.utils import serialize_doc, serialize_many, to_object_id

from .serializers import BookSerializer


class BookListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [AllowAny()]

    def get(self, request):
        q = request.query_params
        query = {}
        if q.get("category_id"):
            query["category_id"] = to_object_id(q["category_id"])
        if q.get("is_free") == "true":
            query["is_free"] = True
        if q.get("search"):
            query["$or"] = [
                {"title_ar": {"$regex": q["search"], "$options": "i"}},
                {"title_en": {"$regex": q["search"], "$options": "i"}},
            ]
        docs = list(col(Collections.BOOKS).find(query).sort("_id", -1))
        out = []
        for d in docs:
            item = serialize_doc(d)
            if getattr(request.user, "is_authenticated", False):
                item["is_purchased"] = item["is_free"] or has_purchased(
                    to_object_id(request.user.id), "book", d["_id"]
                )
            else:
                item["is_purchased"] = d.get("is_free", False)
            out.append(item)
        return Response(out)

    def post(self, request):
        serializer = BookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        if data.get("category_id"):
            data["category_id"] = to_object_id(data["category_id"])
        data["cover"] = None
        data["file_path"] = None
        result = col(Collections.BOOKS).insert_one(data)
        return Response(serialize_doc(col(Collections.BOOKS).find_one({"_id": result.inserted_id})), status=201)


class BookDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAdmin()]

    def get(self, request, book_id):
        doc = col(Collections.BOOKS).find_one({"_id": to_object_id(book_id)})
        if not doc:
            raise NotFound("Book not found.")
        item = serialize_doc(doc)
        if getattr(request.user, "is_authenticated", False):
            item["is_purchased"] = item["is_free"] or has_purchased(
                to_object_id(request.user.id), "book", doc["_id"]
            )
        else:
            item["is_purchased"] = doc.get("is_free", False)
        return Response(item)

    def put(self, request, book_id):
        serializer = BookSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        if "category_id" in data and data["category_id"]:
            data["category_id"] = to_object_id(data["category_id"])
        oid = to_object_id(book_id)
        col(Collections.BOOKS).update_one({"_id": oid}, {"$set": data})
        return Response(serialize_doc(col(Collections.BOOKS).find_one({"_id": oid})))

    def delete(self, request, book_id):
        col(Collections.BOOKS).delete_one({"_id": to_object_id(book_id)})
        return Response(status=204)


class BookFileUploadView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, book_id):
        oid = to_object_id(book_id)
        book = col(Collections.BOOKS).find_one({"_id": oid})
        if not book:
            raise NotFound("Book not found.")
        update = {}
        if "file" in request.FILES:
            file = request.FILES["file"]
            path = default_storage.save(f"books/{uuid.uuid4().hex}{os.path.splitext(file.name)[1]}", file)
            update["file_path"] = f"/media/{path}"
        if "cover" in request.FILES:
            cover = request.FILES["cover"]
            path = default_storage.save(
                f"thumbnails/{uuid.uuid4().hex}{os.path.splitext(cover.name)[1]}", cover
            )
            update["cover"] = f"/media/{path}"
        if not update:
            raise ValidationError({"detail": "No file uploaded."})
        col(Collections.BOOKS).update_one({"_id": oid}, {"$set": update})
        return Response(serialize_doc(col(Collections.BOOKS).find_one({"_id": oid})))


class BookDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id):
        oid = to_object_id(book_id)
        book = col(Collections.BOOKS).find_one({"_id": oid})
        if not book:
            raise NotFound("Book not found.")
        if not book.get("is_free") and not has_purchased(to_object_id(request.user.id), "book", oid):
            raise PermissionDenied("Purchase this book to download it.")
        if not book.get("file_path"):
            raise NotFound("No file uploaded for this book yet.")
        return Response({"file_path": book["file_path"]})
