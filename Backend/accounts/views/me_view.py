import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from accounts.services.auth_service import AuthService
from accounts.services.permissions import IsActiveAuthenticatedUser

logger = logging.getLogger(__name__)


class MeView(APIView):
    """Return the authenticated user's profile."""

    authentication_classes = [SafeJWTAuthentication]
    permission_classes = [IsActiveAuthenticatedUser]

    def get(self, request):
        try:
            result = AuthService.get_current_user_profile(user=request.user)
        except Exception:
            logger.exception("Unexpected error while fetching user profile.")
            return Response(
                {"message": "Authentication service unavailable."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result["success"]:
            message = result["message"]
            if message in ("Your account is inactive.", "Your role is inactive."):
                response_status = status.HTTP_403_FORBIDDEN
            elif message == "User not found.":
                response_status = status.HTTP_404_NOT_FOUND
            elif message == "Authentication service unavailable.":
                response_status = status.HTTP_500_INTERNAL_SERVER_ERROR
            else:
                response_status = status.HTTP_400_BAD_REQUEST

            return Response({"message": message}, status=response_status)

        return Response(
            {
                "message": result["message"],
                "data": result["data"],
            },
            status=status.HTTP_200_OK,
        )

