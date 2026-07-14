import logging

from rest_framework import status
from rest_framework.response import Response

from tasks.serializers.task_serializer import TaskSerializer
from tasks.serializers.update_task_serializer import UpdateTaskSerializer
from tasks.services.task_service import TaskService
from .task_detail_view import TaskDetailView


logger = logging.getLogger(__name__)


class UpdateTaskView(TaskDetailView):
    def patch(self, request, task_id):
        serializer = UpdateTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = TaskService.update_task(
                task_id=task_id,
                requester_id=request.user.id,
                due_date_provided="due_date" in serializer.validated_data,
                **serializer.validated_data,
            )
        except Exception:
            logger.exception("Unexpected error while updating task.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result["success"]:
            code = result.get("code", "")
            if code in ("invalid_task_id", "invalid_assigned_to_id", "project_inactive", "assigned_user_inactive", "user_not_in_project"):
                return Response({"message": result["message"]}, status=status.HTTP_400_BAD_REQUEST)
            if code in ("task_not_found", "assigned_user_not_found"):
                return Response({"message": result["message"]}, status=status.HTTP_404_NOT_FOUND)
            if code == "permission_denied":
                return Response({"message": result["message"]}, status=status.HTTP_403_FORBIDDEN)
            if code == "duplicate_task":
                return Response({"message": result["message"]}, status=status.HTTP_409_CONFLICT)
            return Response({"message": result["message"]}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response_serializer = TaskSerializer(result["data"])
        return Response({"message": result["message"], "data": response_serializer.data}, status=status.HTTP_200_OK)
