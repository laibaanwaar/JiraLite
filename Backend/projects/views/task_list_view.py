import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.serializers import TaskListSerializer
from projects.services.task_service import TaskService


logger = logging.getLogger(__name__)


class TaskListView(APIView):
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
            return Response(
                {"success": False, "message": "Authentication credentials were not provided or are invalid.", "errors": {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return super().handle_exception(exc)

    def get(self, request):
        try:
            result = TaskService.list_accessible_tasks(user=request.user, params=request.query_params)
            serializer = TaskListSerializer(result["results"], many=True)
            return Response(
                {
                    "success": True,
                    "message": "Tasks retrieved successfully.",
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
        except DatabaseError:
            logger.exception("Database error while listing tasks.")
        except Exception:
            logger.exception("Unexpected error while listing tasks.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
