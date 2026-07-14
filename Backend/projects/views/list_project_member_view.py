import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from projects.serializers.project_members_list_serializer import ProjectMembersListSerializer
from projects.services.permissions import IsAdminOrProjectManagerRole
from projects.services.project_member_service import ProjectMemberService


logger = logging.getLogger(__name__)


class ProjectMemberListView(APIView):
    """List members assigned to a project."""

    authentication_classes = [SafeJWTAuthentication]
    permission_classes = [IsAdminOrProjectManagerRole]

    def get(self, request, project_id):
        try:
            result = ProjectMemberService.list_project_members(project_id=project_id)
        except Exception:
            logger.exception("Unexpected error while listing project members.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result["success"]:
            code = result.get("code", "")

            if code == "invalid_project_id":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if code == "project_not_found":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if code == "project_inactive":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {"message": result["message"]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response_serializer = ProjectMembersListSerializer(result["data"])
        return Response(
            {"message": result["message"], "data": response_serializer.data},
            status=status.HTTP_200_OK,
        )
