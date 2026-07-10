import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from accounts.serializers.create_role_serializer import CreateRoleSerializer
from accounts.services.permissions import IsActiveAuthenticatedUser, IsAdminRole
from accounts.services.role_service import RoleService


logger = logging.getLogger(__name__)


class CreateRoleView(APIView):
    """Create a new role."""

    authentication_classes = [SafeJWTAuthentication]
    permission_classes = [IsActiveAuthenticatedUser, IsAdminRole]

    def post(self, request):
        serializer = CreateRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = RoleService.create_role(
                name=serializer.validated_data["name"],
                code=serializer.validated_data["code"],
                description=serializer.validated_data.get("description", ""),
                is_active=serializer.validated_data.get("is_active", True),
            )
        except Exception:
            logger.exception("Unexpected error while creating role.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result["success"]:
            code = result.get("code", "")

            if code in ("duplicate_role_name", "duplicate_role_code"):
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_409_CONFLICT,
                )

            return Response(
                {"message": result["message"]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": result["message"], "data": result["data"]},
            status=status.HTTP_201_CREATED,
        )
