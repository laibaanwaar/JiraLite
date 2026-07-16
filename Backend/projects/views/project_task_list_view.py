import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError, IntegrityError
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.serializers import CreateTaskSerializer, TaskListSerializer, TaskSerializer
from projects.services.task_service import TaskNotFoundError, TaskPermissionError, TaskService


logger = logging.getLogger(__name__)


class ProjectTaskListView(APIView):
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
            return Response(
                {"success": False, "message": "Authentication credentials were not provided or are invalid.", "errors": {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return super().handle_exception(exc)

    def get(self, request, project_id: int):
        try:
            result = TaskService.list_project_tasks(user=request.user, project_id=project_id, params=request.query_params)
            serializer = TaskListSerializer(result["results"], many=True)
            return Response(
                {
                    "success": True,
                    "message": "Project tasks retrieved successfully.",
                    "data": {"count": result["count"], "results": serializer.data},
                },
                status=status.HTTP_200_OK,
            )
        except (DRFValidationError, DjangoValidationError) as exc:
            payload = exc.detail if hasattr(exc, "detail") else exc.message_dict if hasattr(exc, "message_dict") else {}
            return Response(
                {"success": False, "message": "Invalid input.", "errors": payload},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except TaskPermissionError:
            return Response(
                {"success": False, "message": "You do not have permission to access this project's tasks.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except TaskNotFoundError:
            return Response(
                {"success": False, "message": "Project not found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except DatabaseError:
            logger.exception("Database error while listing project tasks.")
        except Exception:
            logger.exception("Unexpected error while listing project tasks.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    def post(self, request, project_id: int):
        serializer = CreateTaskSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            task = TaskService.create_task(user=request.user, project_id=project_id, validated_data=serializer.validated_data)
            response_serializer = TaskSerializer(task)
            return Response(
                {
                    "success": True,
                    "message": "Task created successfully.",
                    "data": response_serializer.data,
                },
                status=status.HTTP_201_CREATED,
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
                {"success": False, "message": "You do not have permission to create tasks in this project.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except TaskNotFoundError:
            return Response(
                {"success": False, "message": "Project not found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except IntegrityError:
            return Response(
                {"success": False, "message": "A conflict occurred while creating the task.", "errors": {}},
                status=status.HTTP_409_CONFLICT,
            )
        except DatabaseError:
            logger.exception("Database error while creating task.")
        except Exception:
            logger.exception("Unexpected error while creating task.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
