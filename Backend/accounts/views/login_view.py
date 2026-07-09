import logging

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import LoginSerializer
from accounts.services.auth_service import AuthService

logger = logging.getLogger(__name__)


class LoginView(APIView):
    """Authenticate a user and return JWT tokens."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = AuthService.login(
                email=serializer.validated_data["email"],
                password=serializer.validated_data["password"],
            )
        except Exception:
            logger.exception("Unexpected error while logging in.")
            return Response(
                {"message": "Authentication service unavailable."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result["success"]:
            message = result["message"]
            if message == "Invalid email or password.":
                response_status = status.HTTP_401_UNAUTHORIZED
            else:
                response_status = status.HTTP_403_FORBIDDEN

            return Response({"message": message}, status=response_status)

        return Response(
            {
                "message": result["message"],
                "data": result["data"],
            },
            status=status.HTTP_200_OK,
        )
