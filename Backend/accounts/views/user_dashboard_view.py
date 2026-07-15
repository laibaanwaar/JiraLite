import logging

from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from accounts.services.permissions import IsActiveAuthenticatedUser, IsAdminRole
from accounts.services.user_service import UserService


logger = logging.getLogger(__name__)


class UserDashboardView(APIView):
    """Return admin-only dashboard statistics for users."""

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
            result = UserService.get_dashboard_stats()
        except Exception:
            logger.exception("Unexpected error while retrieving user dashboard stats.")
            return Response(
                {"message": "A server error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result["success"]:
            return Response(
                {"message": result["message"]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"data": result["data"]}, status=status.HTTP_200_OK)
