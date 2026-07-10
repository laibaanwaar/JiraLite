import logging

from rest_framework import status
from rest_framework.response import Response

from projects.serializers.create_project_serializer import CreateProjectSerializer
from projects.serializers.project_serializer import ProjectSerializer
from projects.views.list_project_view import ProjectListView
from projects.services.project_service import ProjectService


logger = logging.getLogger(__name__)


class CreateProjectView(ProjectListView):
    """Create a new project."""

    def post(self, request):
        serializer = CreateProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = ProjectService.create_project(
                name=serializer.validated_data["name"],
                key=serializer.validated_data["key"],
                description=serializer.validated_data.get("description", ""),
                owner_id=serializer.validated_data["owner_id"],
            )
        except Exception:
            logger.exception("Unexpected error while creating project.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result["success"]:
            code = result.get("code", "")

            if code in ("duplicate_project_name", "duplicate_project_key", "duplicate_project"):
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

        response_serializer = ProjectSerializer(result["data"])
        return Response(
            {"message": result["message"], "data": response_serializer.data},
            status=status.HTTP_201_CREATED,
        )
