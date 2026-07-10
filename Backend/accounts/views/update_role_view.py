import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from accounts.serializers.update_role_serializer import UpdateRoleSerializer
from accounts.services.permissions import IsActiveAuthenticatedUser, IsAdminRole
from accounts.services.role_service import RoleService


logger = logging.getLogger(__name__)


class UpdateRoleView(APIView):
    """Update an existing role."""

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

        serializer = UpdateRoleSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            result = RoleService.update_role(
                role_id=role_id_int,
                name=serializer.validated_data.get("name"),
                code=serializer.validated_data.get("code"),
                description=serializer.validated_data.get("description"),
                is_active=serializer.validated_data.get("is_active"),
            )
        except Exception:
            logger.exception("Unexpected error while updating role.")
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

            if code in ("duplicate_role_name", "duplicate_role_code"):
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_409_CONFLICT,
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

        return Response(
            {"message": result["message"], "data": result["data"]},
            status=status.HTTP_200_OK,
        )
