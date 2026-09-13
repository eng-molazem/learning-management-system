from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

from core.mongo import Collections, col
from core.utils import to_object_id


class SimpleUser:
    """Lightweight stand-in for a user, backed by a Mongo document.

    DRF permission classes only need `.is_authenticated`; views read
    `request.user.doc` for everything else.
    """

    def __init__(self, doc: dict):
        self.doc = doc
        self.id = str(doc["_id"])
        self.role = doc.get("role")
        self.status = doc.get("status", "active")
        self.is_authenticated = True

    def __getattr__(self, item):
        # Fall back to the underlying document for convenience (user.email etc).
        try:
            return self.doc[item]
        except KeyError:
            raise AttributeError(item)


def make_token(user_id: str, token_type: str = "access") -> str:
    now = datetime.now(timezone.utc)
    if token_type == "access":
        ttl = timedelta(minutes=settings.JWT_ACCESS_TTL_MINUTES)
    else:
        ttl = timedelta(days=settings.JWT_REFRESH_TTL_DAYS)
    payload = {
        "sub": str(user_id),
        "type": token_type,
        "iat": now,
        "exp": now + ttl,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def make_token_pair(user_id: str) -> dict:
    return {
        "access": make_token(user_id, "access"),
        "refresh": make_token(user_id, "refresh"),
    }


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise exceptions.AuthenticationFailed("Token expired.")
    except jwt.InvalidTokenError:
        raise exceptions.AuthenticationFailed("Invalid token.")


class JWTAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        header = request.META.get("HTTP_AUTHORIZATION", "")
        if not header.startswith(f"{self.keyword} "):
            return None
        token = header[len(self.keyword) + 1 :].strip()
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise exceptions.AuthenticationFailed("Wrong token type.")
        try:
            oid = to_object_id(payload["sub"])
        except Exception:
            raise exceptions.AuthenticationFailed("Invalid subject.")
        doc = col(Collections.USERS).find_one({"_id": oid})
        if not doc:
            raise exceptions.AuthenticationFailed("User not found.")
        return (SimpleUser(doc), token)
