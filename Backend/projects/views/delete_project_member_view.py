import logging

from rest_framework import status
from rest_framework.response import Response

from projects.serializers.project_member_serializer import ProjectMemberSerializer
from projects.services.project_member_service import ProjectMemberService
from .list_project_member_view import ProjectMemberListView


logger = logging.getLogger(__name__)


class DeleteProjectMemberView(ProjectMemberListView):
    """Remove a user from a project."""

    def delete(self, request, project_id, user_id):
        try:
            result = ProjectMemberService.remove_project_member(
                project_id=project_id,
                user_id=user_id,
            )
        except Exception:
            logger.exception("Unexpected error while deleting project member.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result["success"]:
            code = result.get("code", "")

            if code in ("invalid_project_id", "invalid_user_id"):
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if code in ("project_not_found", "user_not_found", "membership_not_found"):
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if code in ("project_inactive", "user_inactive"):
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if code == "owner_removal_forbidden":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_409_CONFLICT,
                )

            return Response(
                {"message": result["message"]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response_serializer = ProjectMemberSerializer(result["data"])
        return Response(
            {"message": result["message"], "data": response_serializer.data},
            status=status.HTTP_200_OK,
        )
