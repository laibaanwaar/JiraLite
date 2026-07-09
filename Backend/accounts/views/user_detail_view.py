import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from accounts.services.permissions import IsActiveAuthenticatedUser, IsAdminRole
from accounts.services.user_service import UserService


logger = logging.getLogger(__name__)


class UserDetailView(APIView):
    authentication_classes = [SafeJWTAuthentication]
    permission_classes = [IsActiveAuthenticatedUser, IsAdminRole]

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
