from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Allow access only to active admin users."""

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.is_active):
            return False

        role = getattr(request.user, "role", None)
        return bool(role and role.is_active and role.code == "admin")
