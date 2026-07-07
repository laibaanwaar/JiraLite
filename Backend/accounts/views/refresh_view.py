from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import RefreshTokenSerializer
from accounts.services.auth_service import AuthService


class RefreshTokenView(APIView):
    """Issue a new access token from a valid refresh token."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = AuthService.refresh_access_token(
            refresh_token=serializer.validated_data["refresh"],
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
            {
                "message": result["message"],
                "data": result["data"],
            },
            status=status.HTTP_200_OK,
        )

