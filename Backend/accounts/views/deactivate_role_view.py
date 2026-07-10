import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from accounts.serializers.role_serializer import RoleSerializer
from accounts.services.permissions import IsActiveAuthenticatedUser, IsAdminRole
from accounts.services.role_service import RoleService


logger = logging.getLogger(__name__)


class DeactivateRoleView(APIView):
    """Soft deactivate a role."""

    authentication_classes = [SafeJWTAuthentication]
    permission_classes = [IsActiveAuthenticatedUser, IsAdminRole]

    def patch(self, request, role_id):
        try:
            role_id_int = int(role_id)
            if role_id_int <= 0:
                return Response(
                    {"message": "Invalid role ID."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except (ValueError, TypeError):
            return Response(
                {"message": "Invalid role ID."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = RoleService.deactivate_role(role_id=role_id_int)
        except Exception:
            logger.exception("Unexpected error while deactivating role.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result["success"]:
            code = result.get("code", "")

            if code == "role_not_found":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if code == "role_already_inactive":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if code == "system_role_protected":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_403_FORBIDDEN,
                )

            return Response(
                {"message": result["message"]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = RoleSerializer(result["data"])
        return Response(
            {"message": result["message"], "data": serializer.data},
            status=status.HTTP_200_OK,
        )
