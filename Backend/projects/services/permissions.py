from rest_framework.permissions import BasePermission


class IsAdminOrProjectManagerRole(BasePermission):
    """Allow access only to active Admin or Project/Task Manager users."""

    message = "You do not have permission to perform this action."

    allowed_role_codes = {"admin", "task_manager", "project_manager"}

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.is_active):
            return False

        role = getattr(request.user, "role", None)
        return bool(role and role.is_active and role.code in self.allowed_role_codes)
