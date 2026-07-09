import logging

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import LogoutSerializer
from accounts.services.auth_service import AuthService

logger = logging.getLogger(__name__)


class LogoutView(APIView):
    """Blacklist a refresh token and end the session."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = AuthService.logout_refresh_token(
                refresh_token=serializer.validated_data["refresh"],
            )
        except Exception:
            logger.exception("Unexpected error while logging out.")
            return Response(
                {"message": "Authentication service unavailable."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result["success"]:
            message = result["message"]
            if message == "Invalid or expired refresh token.":
                response_status = status.HTTP_401_UNAUTHORIZED
            elif message == "Authentication service unavailable.":
                response_status = status.HTTP_500_INTERNAL_SERVER_ERROR
            else:
                response_status = status.HTTP_403_FORBIDDEN

            return Response({"message": message}, status=response_status)

        return Response(
            {"message": result["message"]},
            status=status.HTTP_200_OK,
        )
