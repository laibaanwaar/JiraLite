import logging

from rest_framework import status
from rest_framework.response import Response

from accounts.serializers.role_serializer import RoleSerializer
from accounts.views.update_role_view import UpdateRoleView
from accounts.services.role_service import RoleService


logger = logging.getLogger(__name__)


class RoleDetailView(UpdateRoleView):
    def get(self, request, role_id):
        try:
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

            result = RoleService.get_role_by_id(role_id_int)

            if not result["success"]:
                code = result.get("code", "")

                if code == "role_not_found":
                    return Response(
                        {"message": result["message"]},
                        status=status.HTTP_404_NOT_FOUND,
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
        except Exception:
            logger.exception("Unexpected error while retrieving role detail.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
