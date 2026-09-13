from datetime import datetime, timezone

from pymongo.errors import DuplicateKeyError
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.mongo import Collections, col
from core.permissions import IsAuthenticated
from core.utils import serialize_doc, serialize_many, to_object_id

from .serializers import CommentSerializer, PostSerializer


def now():
    return datetime.now(timezone.utc)


def _author(user_id):
    user = col(Collections.USERS).find_one({"_id": user_id})
    return {"id": str(user_id), "name": user["name"], "avatar": user.get("avatar")} if user else None


class PostListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        q = request.query_params
        query = {}
        if q.get("search"):
            query["$or"] = [
                {"title": {"$regex": q["search"], "$options": "i"}},
                {"content": {"$regex": q["search"], "$options": "i"}},
            ]
        if q.get("tag"):
            query["tags"] = q["tag"]
        docs = list(col(Collections.COMMUNITY_POSTS).find(query).sort("created_at", -1))
        out = []
        for d in docs:
            item = serialize_doc(d)
            item["author"] = _author(d["user_id"])
            item["comment_count"] = col(Collections.COMMUNITY_COMMENTS).count_documents({"post_id": d["_id"]})
            item["like_count"] = col(Collections.COMMUNITY_LIKES).count_documents({"post_id": d["_id"]})
            if getattr(request.user, "is_authenticated", False):
                item["liked_by_me"] = (
                    col(Collections.COMMUNITY_LIKES).find_one(
                        {"post_id": d["_id"], "user_id": to_object_id(request.user.id)}
                    )
                    is not None
                )
            else:
                item["liked_by_me"] = False
            out.append(item)
        return Response(out)

    def post(self, request):
        serializer = PostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        data["user_id"] = to_object_id(request.user.id)
        data["created_at"] = now()
        result = col(Collections.COMMUNITY_POSTS).insert_one(data)
        doc = col(Collections.COMMUNITY_POSTS).find_one({"_id": result.inserted_id})
        item = serialize_doc(doc)
        item["author"] = _author(doc["user_id"])
        item["comment_count"] = 0
        item["like_count"] = 0
        item["liked_by_me"] = False
        return Response(item, status=201)


class PostDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, post_id):
        doc = col(Collections.COMMUNITY_POSTS).find_one({"_id": to_object_id(post_id)})
        if not doc:
            raise NotFound("Post not found.")
        item = serialize_doc(doc)
        item["author"] = _author(doc["user_id"])
        comments = list(
            col(Collections.COMMUNITY_COMMENTS).find({"post_id": doc["_id"]}).sort("created_at", 1)
        )
        comment_out = []
        for c in comments:
            c_item = serialize_doc(c)
            c_item["author"] = _author(c["user_id"])
            comment_out.append(c_item)
        item["comments"] = comment_out
        item["like_count"] = col(Collections.COMMUNITY_LIKES).count_documents({"post_id": doc["_id"]})
        if getattr(request.user, "is_authenticated", False):
            item["liked_by_me"] = (
                col(Collections.COMMUNITY_LIKES).find_one(
                    {"post_id": doc["_id"], "user_id": to_object_id(request.user.id)}
                )
                is not None
            )
        else:
            item["liked_by_me"] = False
        return Response(item)

    def delete(self, request, post_id):
        doc = col(Collections.COMMUNITY_POSTS).find_one({"_id": to_object_id(post_id)})
        if not doc:
            raise NotFound("Post not found.")
        if request.user.role != "admin" and str(doc["user_id"]) != request.user.id:
            raise PermissionDenied("You cannot delete this post.")
        col(Collections.COMMUNITY_POSTS).delete_one({"_id": doc["_id"]})
        col(Collections.COMMUNITY_COMMENTS).delete_many({"post_id": doc["_id"]})
        col(Collections.COMMUNITY_LIKES).delete_many({"post_id": doc["_id"]})
        return Response(status=204)


class CommentCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post_oid = to_object_id(post_id)
        if not col(Collections.COMMUNITY_POSTS).find_one({"_id": post_oid}):
            raise NotFound("Post not found.")
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        data["post_id"] = post_oid
        data["user_id"] = to_object_id(request.user.id)
        data["created_at"] = now()
        result = col(Collections.COMMUNITY_COMMENTS).insert_one(data)
        doc = col(Collections.COMMUNITY_COMMENTS).find_one({"_id": result.inserted_id})
        item = serialize_doc(doc)
        item["author"] = _author(doc["user_id"])
        return Response(item, status=201)


class CommentDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, comment_id):
        doc = col(Collections.COMMUNITY_COMMENTS).find_one({"_id": to_object_id(comment_id)})
        if not doc:
            raise NotFound("Comment not found.")
        if request.user.role != "admin" and str(doc["user_id"]) != request.user.id:
            raise PermissionDenied("You cannot delete this comment.")
        col(Collections.COMMUNITY_COMMENTS).delete_one({"_id": doc["_id"]})
        return Response(status=204)


class LikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post_oid = to_object_id(post_id)
        user_oid = to_object_id(request.user.id)
        existing = col(Collections.COMMUNITY_LIKES).find_one({"post_id": post_oid, "user_id": user_oid})
        if existing:
            col(Collections.COMMUNITY_LIKES).delete_one({"_id": existing["_id"]})
            liked = False
        else:
            try:
                col(Collections.COMMUNITY_LIKES).insert_one(
                    {"post_id": post_oid, "user_id": user_oid, "created_at": now()}
                )
                liked = True
            except DuplicateKeyError:
                liked = True
        count = col(Collections.COMMUNITY_LIKES).count_documents({"post_id": post_oid})
        return Response({"liked": liked, "like_count": count})
