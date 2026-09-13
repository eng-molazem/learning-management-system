from rest_framework.permissions import BasePermission


class IsAuthenticated(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and getattr(request.user, "is_authenticated", False))


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == "admin")


class IsInstructor(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role == "instructor"
            and user.status == "active"
        )


class IsInstructorOrAdmin(BasePermission):
    """Any active instructor, or an admin (admins can act on anyone's content)."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.role == "admin":
            return True
        return user.role == "instructor" and user.status == "active"


def is_owner_or_admin(user, owner_id: str) -> bool:
    if user.role == "admin":
        return True
    return str(owner_id) == str(user.id)
