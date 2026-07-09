import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers.create_user_serializer import CreateUserSerializer
from accounts.services.permissions import IsActiveAuthenticatedUser, IsAdminRole
from accounts.services.user_service import UserService


logger = logging.getLogger(__name__)


class CreateUserView(APIView):
    """Create a new user account. Accessible by Admin only."""

    permission_classes = [IsActiveAuthenticatedUser, IsAdminRole]

    def post(self, request):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = UserService.create_user(
            first_name=serializer.validated_data["first_name"],
            last_name=serializer.validated_data["last_name"],
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            role_id=serializer.validated_data["role_id"],
        )

        if not result["success"]:
            code = result.get("code", "")

            if code == "role_not_found":
                return Response({"message": result["message"]}, status=status.HTTP_404_NOT_FOUND)

            if code == "duplicate_email":
                return Response({"message": result["message"]}, status=status.HTTP_409_CONFLICT)

            if code == "role_inactive":
                return Response({"message": result["message"]}, status=status.HTTP_400_BAD_REQUEST)

            return Response(
                {"message": result["message"]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": result["message"], "data": result["data"]},
            status=status.HTTP_201_CREATED,
        )
