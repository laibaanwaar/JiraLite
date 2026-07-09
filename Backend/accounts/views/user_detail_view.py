import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from accounts.serializers.update_user_serializer import UpdateUserSerializer
from accounts.services.permissions import IsActiveAuthenticatedUser, IsAdminRole
from accounts.services.user_service import UserService


logger = logging.getLogger(__name__)


class UserDetailView(APIView):
    authentication_classes = [SafeJWTAuthentication]
    permission_classes = [IsActiveAuthenticatedUser, IsAdminRole]

    @staticmethod
    def _validation_error_message(errors):
        if isinstance(errors, dict):
            for value in errors.values():
                if isinstance(value, list) and value:
                    return str(value[0])
                if value:
                    return str(value)
        if isinstance(errors, list) and errors:
            return str(errors[0])
        return "Invalid request data."

    def get(self, request, user_id):
        try:
            try:
                user_id_int = int(user_id)
                if user_id_int <= 0:
                    return Response(
                        {"message": "Invalid user ID."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except (ValueError, TypeError):
                return Response(
                    {"message": "Invalid user ID."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            result = UserService.get_user_by_id(user_id_int)

            if not result["success"]:
                code = result.get("code", "")

                if code == "user_not_found":
                    return Response(
                        {"message": result["message"]},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {
                    "message": result["message"],
                    "data": result["data"],
                },
                status=status.HTTP_200_OK,
            )

        except Exception:
            logger.exception("Unexpected error while retrieving user detail.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def patch(self, request, user_id):
        try:
            try:
                user_id_int = int(user_id)
                if user_id_int <= 0:
                    return Response(
                        {"message": "Invalid user ID."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except (ValueError, TypeError):
                return Response(
                    {"message": "Invalid user ID."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = UpdateUserSerializer(data=request.data, partial=True)
            if not serializer.is_valid():
                return Response(
                    {"message": self._validation_error_message(serializer.errors)},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            result = UserService.update_user(
                user_id=user_id_int,
                actor_user=request.user,
                first_name=serializer.validated_data.get("first_name"),
                last_name=serializer.validated_data.get("last_name"),
                email=serializer.validated_data.get("email"),
                role_id=serializer.validated_data.get("role_id"),
            )

            if not result["success"]:
                code = result.get("code", "")

                if code == "user_not_found":
                    return Response(
                        {"message": result["message"]},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                if code == "role_not_found":
                    return Response(
                        {"message": result["message"]},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                if code == "role_inactive":
                    return Response(
                        {"message": result["message"]},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if code == "duplicate_email":
                    return Response(
                        {"message": result["message"]},
                        status=status.HTTP_409_CONFLICT,
                    )

                if code == "admin_role_change_not_allowed":
                    return Response(
                        {"message": result["message"]},
                        status=status.HTTP_403_FORBIDDEN,
                    )

                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {"message": result["message"], "data": result["data"]},
                status=status.HTTP_200_OK,
            )

        except Exception:
            logger.exception("Unexpected error while updating user detail.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
