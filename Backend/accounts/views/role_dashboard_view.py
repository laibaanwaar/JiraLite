import logging

from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from accounts.serializers.role_dashboard_serializer import RoleDashboardSerializer
from accounts.services.permissions import IsActiveAuthenticatedUser, IsAdminRole
from accounts.services.role_service import RoleService


logger = logging.getLogger(__name__)


class RoleDashboardView(APIView):
    """Return admin-only dashboard statistics for roles."""

    authentication_classes = [SafeJWTAuthentication]
    permission_classes = [IsActiveAuthenticatedUser, IsAdminRole]

    def handle_exception(self, exc):
        if isinstance(exc, (exceptions.NotAuthenticated, exceptions.AuthenticationFailed)):
            return Response({"message": "Unauthorized."}, status=status.HTTP_401_UNAUTHORIZED)

        if isinstance(exc, exceptions.PermissionDenied):
            return Response({"message": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        return super().handle_exception(exc)

    def get(self, request):
        try:
            result = RoleService.get_dashboard_stats()
        except Exception:
            logger.exception("Unexpected error while retrieving role dashboard stats.")
            return Response(
                {"message": "A server error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result["success"]:
            return Response(
                {"message": result["message"]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = RoleDashboardSerializer(result["data"])
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)
