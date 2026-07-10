import logging

from rest_framework import status
from rest_framework.response import Response

from accounts.serializers.role_serializer import RoleSerializer
from accounts.views.create_role_view import CreateRoleView
from accounts.services.role_service import RoleService


logger = logging.getLogger(__name__)


class RoleListView(CreateRoleView):
    def get(self, request):
        try:
            result = RoleService.get_all_roles()

            if not result["success"]:
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            serializer = RoleSerializer(result["data"], many=True)
            return Response(
                {"message": result["message"], "data": serializer.data},
                status=status.HTTP_200_OK,
            )
        except Exception:
            logger.exception("Unexpected error while listing roles.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
