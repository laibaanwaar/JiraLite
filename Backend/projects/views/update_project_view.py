import logging

from rest_framework import status
from rest_framework.response import Response

from projects.serializers.project_detail_serializer import ProjectDetailSerializer
from projects.serializers.update_project_serializer import UpdateProjectSerializer
from projects.views.project_detail_view import ProjectDetailView
from projects.services.project_service import ProjectService


logger = logging.getLogger(__name__)


class UpdateProjectView(ProjectDetailView):
    def patch(self, request, project_id):
        serializer = UpdateProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = ProjectService.update_project(
                project_id=project_id,
                **serializer.validated_data,
            )
        except Exception:
            logger.exception("Unexpected error while updating project.")
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

            if code in ("duplicate_project_name", "duplicate_project_key", "duplicate_project"):
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_409_CONFLICT,
                )

            if code == "project_archived":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_409_CONFLICT,
                )

            if code == "owner_not_found":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if code == "owner_inactive":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {"message": result["message"]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response_serializer = ProjectDetailSerializer(result["data"])
        return Response(
            {"message": result["message"], "data": response_serializer.data},
            status=status.HTTP_200_OK,
        )
