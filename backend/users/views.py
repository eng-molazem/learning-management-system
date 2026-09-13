import os
import uuid
from datetime import datetime, timezone

from django.contrib.auth.hashers import check_password, make_password
from django.core.files.storage import default_storage
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.jwt_auth import decode_token, make_token, make_token_pair
from core.mongo import Collections, col
from core.permissions import IsAdmin, IsAuthenticated
from core.utils import serialize_doc, serialize_many, to_object_id

from .serializers import (
    AdminUserUpdateSerializer,
    LoginSerializer,
    ProfileUpdateSerializer,
    RefreshSerializer,
    RegisterSerializer,
)


def now():
    return datetime.now(timezone.utc)


def public_user(doc: dict) -> dict:
    doc = serialize_doc(doc)
    doc.pop("password_hash", None)
    return doc


def user_stats(user_id):
    enrollments = col(Collections.ENROLLMENTS)
    certificates = col(Collections.CERTIFICATES)
    total = enrollments.count_documents({"user_id": user_id})
    completed = enrollments.count_documents({"user_id": user_id, "completed": True})
    certs = certificates.count_documents({"user_id": user_id})
    return {
        "courses_enrolled": total,
        "courses_completed": completed,
        "certificates_earned": certs,
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        users = col(Collections.USERS)
        if users.find_one({"email": data["email"]}):
            raise ValidationError({"email": "Email already registered."})

        status = "pending" if data["role"] == "instructor" else "active"
        doc = {
            "name": data["name"],
            "email": data["email"],
            "password_hash": make_password(data["password"]),
            "role": data["role"],
            "status": status,
            "avatar": None,
            "bio": "",
            "xp": 0,
            "level": 1,
            "streak": 0,
            "last_active_date": None,
            "lang_pref": data["lang_pref"],
            "created_at": now(),
        }
        result = users.insert_one(doc)
        doc["_id"] = result.inserted_id

        tokens = make_token_pair(str(doc["_id"]))
        return Response(
            {"user": public_user(doc), **tokens},
            status=201,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        users = col(Collections.USERS)
        doc = users.find_one({"email": data["email"]})
        if not doc or not check_password(data["password"], doc["password_hash"]):
            raise AuthenticationFailed("Invalid email or password.")
        if doc.get("status") == "rejected":
            raise PermissionDenied("Your instructor application was rejected.")
        if doc.get("status") == "banned":
            raise PermissionDenied("This account has been suspended.")

        today = now().date().isoformat()
        last_active = doc.get("last_active_date")
        streak = doc.get("streak", 0)
        if last_active != today:
            from datetime import date, timedelta

            if last_active == (date.today() - timedelta(days=1)).isoformat():
                streak += 1
            else:
                streak = 1
            users.update_one(
                {"_id": doc["_id"]}, {"$set": {"last_active_date": today, "streak": streak}}
            )
            doc["last_active_date"] = today
            doc["streak"] = streak

        tokens = make_token_pair(str(doc["_id"]))
        return Response({"user": public_user(doc), **tokens})


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = decode_token(serializer.validated_data["refresh"])
        if payload.get("type") != "refresh":
            raise AuthenticationFailed("Wrong token type.")
        access = make_token(payload["sub"], "access")
        return Response({"access": access})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = public_user(request.user.doc)
        data["stats"] = user_stats(request.user.doc["_id"])
        return Response(data)

    def put(self, request):
        serializer = ProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        update = {k: v for k, v in serializer.validated_data.items() if v is not None}
        if update:
            col(Collections.USERS).update_one({"_id": request.user.doc["_id"]}, {"$set": update})
        doc = col(Collections.USERS).find_one({"_id": request.user.doc["_id"]})
        return Response(public_user(doc))


class MeAvatarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("avatar")
        if not file:
            raise ValidationError({"avatar": "No file uploaded."})
        ext = os.path.splitext(file.name)[1]
        filename = f"avatars/{uuid.uuid4().hex}{ext}"
        path = default_storage.save(filename, file)
        url = f"/media/{path}"
        col(Collections.USERS).update_one(
            {"_id": request.user.doc["_id"]}, {"$set": {"avatar": url}}
        )
        return Response({"avatar": url})


# ---- Admin ----


class AdminUsersListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        query = {}
        role = request.query_params.get("role")
        status = request.query_params.get("status")
        search = request.query_params.get("search")
        if role:
            query["role"] = role
        if status:
            query["status"] = status
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
            ]
        docs = list(col(Collections.USERS).find(query).sort("created_at", -1))
        return Response(serialize_many([{k: v for k, v in d.items() if k != "password_hash"} for d in docs]))


class AdminPendingInstructorsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        docs = list(
            col(Collections.USERS).find({"role": "instructor", "status": "pending"}).sort(
                "created_at", -1
            )
        )
        return Response(serialize_many([{k: v for k, v in d.items() if k != "password_hash"} for d in docs]))


class AdminUserDetailView(APIView):
    permission_classes = [IsAdmin]

    def put(self, request, user_id):
        serializer = AdminUserUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        update = {k: v for k, v in serializer.validated_data.items() if v is not None}
        if not update:
            raise ValidationError({"detail": "Nothing to update."})
        oid = to_object_id(user_id)
        col(Collections.USERS).update_one({"_id": oid}, {"$set": update})
        if update.get("status") in ("active", "rejected") and "role" not in update:
            _notify_status_change(oid, update["status"])
        doc = col(Collections.USERS).find_one({"_id": oid})
        return Response(public_user(doc))

    def delete(self, request, user_id):
        col(Collections.USERS).delete_one({"_id": to_object_id(user_id)})
        return Response(status=204)


def _notify_status_change(user_id, status):
    label = "تمت الموافقة على حسابك كمدرب" if status == "active" else "تم رفض طلب الانضمام كمدرب"
    col(Collections.NOTIFICATIONS).insert_one(
        {
            "user_id": user_id,
            "title": label,
            "message": label,
            "type": "instructor_status",
            "course_id": None,
            "is_read": False,
            "created_at": now(),
        }
    )
