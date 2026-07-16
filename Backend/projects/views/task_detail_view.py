import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError, IntegrityError
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.serializers import TaskSerializer, UpdateTaskSerializer
from projects.services.task_service import TaskNotFoundError, TaskPermissionError, TaskService


logger = logging.getLogger(__name__)


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
            return Response(
                {"success": False, "message": "Authentication credentials were not provided or are invalid.", "errors": {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return super().handle_exception(exc)

    def get(self, request, task_id: int):
        try:
            task = TaskService.get_task(user=request.user, task_id=task_id)
            serializer = TaskSerializer(task)
            return Response(
                {"success": True, "message": "Task retrieved successfully.", "data": serializer.data},
                status=status.HTTP_200_OK,
            )
        except TaskNotFoundError:
            return Response(
                {"success": False, "message": "Task not found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except DatabaseError:
            logger.exception("Database error while retrieving task.")
        except Exception:
            logger.exception("Unexpected error while retrieving task.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    def patch(self, request, task_id: int):
        serializer = UpdateTaskSerializer(data=request.data, partial=True)
        try:
            serializer.is_valid(raise_exception=True)
            task = TaskService.update_task(user=request.user, task_id=task_id, validated_data=serializer.validated_data)
            response_serializer = TaskSerializer(task)
            return Response(
                {"success": True, "message": "Task updated successfully.", "data": response_serializer.data},
                status=status.HTTP_200_OK,
            )
        except DRFValidationError as exc:
            return Response(
                {"success": False, "message": "Invalid input.", "errors": exc.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else {}
            return Response(
                {"success": False, "message": "Invalid input.", "errors": payload},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except TaskPermissionError:
            return Response(
                {"success": False, "message": "You do not have permission to update this task.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except TaskNotFoundError:
            return Response(
                {"success": False, "message": "Task not found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except IntegrityError:
            return Response(
                {"success": False, "message": "A conflict occurred while updating the task.", "errors": {}},
                status=status.HTTP_409_CONFLICT,
            )
        except DatabaseError:
            logger.exception("Database error while updating task.")
        except Exception:
            logger.exception("Unexpected error while updating task.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    def delete(self, request, task_id: int):
        try:
            TaskService.delete_task(user=request.user, task_id=task_id)
            return Response(
                {"success": True, "message": "Task deleted successfully.", "data": None},
                status=status.HTTP_200_OK,
            )
        except TaskPermissionError:
            return Response(
                {"success": False, "message": "You do not have permission to delete this task.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except TaskNotFoundError:
            return Response(
                {"success": False, "message": "Task not found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except DatabaseError:
            logger.exception("Database error while deleting task.")
        except Exception:
            logger.exception("Unexpected error while deleting task.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
