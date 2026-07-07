from rest_framework.permissions import BasePermission


class IsActiveAuthenticatedUser(BasePermission):
    """Allow access only to authenticated, active users."""

    message = "Your account is inactive."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_active)

