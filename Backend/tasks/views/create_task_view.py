import logging

from rest_framework import status
from rest_framework.response import Response

from tasks.serializers.create_task_serializer import CreateTaskSerializer
from tasks.serializers.task_serializer import TaskSerializer
from tasks.services.task_service import TaskService
from .list_task_view import TaskListView


logger = logging.getLogger(__name__)


class CreateTaskView(TaskListView):
    """Create a new task."""

    def post(self, request):
        serializer = CreateTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = TaskService.create_task(
                title=serializer.validated_data["title"],
                description=serializer.validated_data.get("description", ""),
                project_id=serializer.validated_data["project_id"],
                assigned_to_id=serializer.validated_data["assigned_to_id"],
                created_by_id=request.user.id,
            )
        except Exception:
            logger.exception("Unexpected error while creating task.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result["success"]:
            code = result.get("code", "")

            if code in ("invalid_project_id", "invalid_assigned_to_id", "invalid_created_by_id", "project_inactive", "assigned_user_inactive", "user_not_in_project"):
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if code in ("project_not_found", "assigned_user_not_found"):
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if code == "permission_denied":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if code == "duplicate_task":
                return Response(
                    {"message": result["message"]},
                    status=status.HTTP_409_CONFLICT,
                )

            return Response(
                {"message": result["message"]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response_serializer = TaskSerializer(result["data"])
        return Response(
            {"message": result["message"], "data": response_serializer.data},
            status=status.HTTP_201_CREATED,
        )
