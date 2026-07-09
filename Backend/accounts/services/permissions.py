from rest_framework.permissions import BasePermission


class IsActiveAuthenticatedUser(BasePermission):
    """Allow access only to authenticated, active users."""

    message = "Your account is inactive."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_active)


class IsAdminRole(BasePermission):
    """Allow access only to users who hold the Admin role."""

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.is_active):
            return False

        role = getattr(request.user, "role", None)
        return role is not None and role.code == "admin" and role.is_active
