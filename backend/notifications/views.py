from rest_framework.response import Response
from rest_framework.views import APIView

from core.mongo import Collections, col
from core.permissions import IsAuthenticated
from core.utils import serialize_many, to_object_id


class MyNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        docs = list(
            col(Collections.NOTIFICATIONS)
            .find({"user_id": to_object_id(request.user.id)})
            .sort("created_at", -1)
            .limit(50)
        )
        return Response(serialize_many(docs))


class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = col(Collections.NOTIFICATIONS).count_documents(
            {"user_id": to_object_id(request.user.id), "is_read": False}
        )
        return Response({"count": count})


class MarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        col(Collections.NOTIFICATIONS).update_one(
            {"_id": to_object_id(notification_id), "user_id": to_object_id(request.user.id)},
            {"$set": {"is_read": True}},
        )
        return Response({"detail": "Marked as read."})


class MarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        col(Collections.NOTIFICATIONS).update_many(
            {"user_id": to_object_id(request.user.id), "is_read": False}, {"$set": {"is_read": True}}
        )
        return Response({"detail": "All marked as read."})
