import logging

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .login_serializer import LoginSerializer
from .login_service import LoginService


logger = logging.getLogger(__name__)


class LoginAPIView(APIView):
    """
    POST /api/auth/login/

    Public endpoint used to authenticate registered users.
    """

    permission_classes = [AllowAny]

    # Rate-limit login attempts.
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data
        )

        # DRF automatically returns validation errors
        # for missing/invalid input.
        serializer.is_valid(
            raise_exception=True
        )

        result = LoginService.login(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        return Response(
            {
                "success": True,
                "message": "Login successful.",
                "data": result,
            },
            status=status.HTTP_200_OK,
        )