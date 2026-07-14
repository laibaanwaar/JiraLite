import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SafeJWTAuthentication
from tasks.serializers.task_serializer import TaskSerializer
from tasks.services.permissions import IsAdminRole
from tasks.services.task_service import TaskService


logger = logging.getLogger(__name__)


class TaskDetailView(APIView):
    authentication_classes = [SafeJWTAuthentication]
    permission_classes = [IsAdminRole]

    def get(self, request, task_id):
        try:
            result = TaskService.get_task_by_id(task_id=task_id)
        except Exception:
            logger.exception("Unexpected error while retrieving task detail.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not result["success"]:
            code = result.get("code", "")
            if code == "invalid_task_id":
                return Response({"message": result["message"]}, status=status.HTTP_400_BAD_REQUEST)
            if code == "task_not_found":
                return Response({"message": result["message"]}, status=status.HTTP_404_NOT_FOUND)
            if code == "project_inactive":
                return Response({"message": result["message"]}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"message": result["message"]}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = TaskSerializer(result["data"])
        return Response({"message": result["message"], "data": serializer.data}, status=status.HTTP_200_OK)
