from rest_framework.permissions import BasePermission


def is_account_admin(user) -> bool:
    role = getattr(user, "role", None)
    return getattr(role, "code", None) == "ADMIN"


class IsAccountAdmin(BasePermission):
    message = "Permission denied."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and is_account_admin(request.user))
