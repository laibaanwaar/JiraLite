import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError, IntegrityError
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.serializers import CreateTaskCommentSerializer, TaskCommentSerializer
from projects.services.task_comment_service import (
    TaskCommentNotFoundError,
    TaskCommentPermissionError,
    TaskCommentService,
)


logger = logging.getLogger(__name__)


class TaskCommentListView(APIView):
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
            comments = TaskCommentService.list_comments(user=request.user, task_id=task_id)
            serializer = TaskCommentSerializer(
                comments,
                many=True,
                context={"request_user": request.user},
            )
            return Response(
                {
                    "success": True,
                    "message": "Task comments retrieved successfully.",
                    "data": {"count": len(serializer.data), "results": serializer.data},
                },
                status=status.HTTP_200_OK,
            )
        except TaskCommentNotFoundError:
            return Response(
                {"success": False, "message": "Task not found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except TaskCommentPermissionError:
            return Response(
                {"success": False, "message": "You do not have permission to access this task's comments.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except DatabaseError:
            logger.exception("Database error while listing task comments.")
        except Exception:
            logger.exception("Unexpected error while listing task comments.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    def post(self, request, task_id: int):
        serializer = CreateTaskCommentSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            comment = TaskCommentService.create_comment(
                user=request.user,
                task_id=task_id,
                content=serializer.validated_data["content"],
            )
            response_serializer = TaskCommentSerializer(comment, context={"request_user": request.user})
            return Response(
                {
                    "success": True,
                    "message": "Task comment created successfully.",
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
        except TaskCommentNotFoundError:
            return Response(
                {"success": False, "message": "Task not found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except TaskCommentPermissionError:
            return Response(
                {"success": False, "message": "You do not have permission to comment on this task.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except IntegrityError:
            return Response(
                {"success": False, "message": "A conflict occurred while creating the comment.", "errors": {}},
                status=status.HTTP_409_CONFLICT,
            )
        except DatabaseError:
            logger.exception("Database error while creating task comment.")
        except Exception:
            logger.exception("Unexpected error while creating task comment.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
