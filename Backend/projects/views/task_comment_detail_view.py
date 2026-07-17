import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError, IntegrityError
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.serializers import TaskCommentSerializer, UpdateTaskCommentSerializer
from projects.services.task_comment_service import (
    TaskCommentNotFoundError,
    TaskCommentPermissionError,
    TaskCommentService,
)


logger = logging.getLogger(__name__)


class TaskCommentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
            return Response(
                {"success": False, "message": "Authentication credentials were not provided or are invalid.", "errors": {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return super().handle_exception(exc)

    def patch(self, request, comment_id: int):
        serializer = UpdateTaskCommentSerializer(data=request.data, partial=True)
        try:
            serializer.is_valid(raise_exception=True)
            comment = TaskCommentService.update_comment(
                user=request.user,
                comment_id=comment_id,
                content=serializer.validated_data["content"],
            )
            response_serializer = TaskCommentSerializer(comment, context={"request_user": request.user})
            return Response(
                {"success": True, "message": "Task comment updated successfully.", "data": response_serializer.data},
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
        except TaskCommentNotFoundError:
            return Response(
                {"success": False, "message": "Comment not found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except TaskCommentPermissionError:
            return Response(
                {"success": False, "message": "You do not have permission to modify this comment.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except IntegrityError:
            return Response(
                {"success": False, "message": "A conflict occurred while updating the comment.", "errors": {}},
                status=status.HTTP_409_CONFLICT,
            )
        except DatabaseError:
            logger.exception("Database error while updating task comment.")
        except Exception:
            logger.exception("Unexpected error while updating task comment.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    def delete(self, request, comment_id: int):
        try:
            TaskCommentService.delete_comment(user=request.user, comment_id=comment_id)
            return Response(
                {"success": True, "message": "Task comment deleted successfully.", "data": None},
                status=status.HTTP_200_OK,
            )
        except TaskCommentNotFoundError:
            return Response(
                {"success": False, "message": "Comment not found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except TaskCommentPermissionError:
            return Response(
                {"success": False, "message": "You do not have permission to modify this comment.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except DatabaseError:
            logger.exception("Database error while deleting task comment.")
        except Exception:
            logger.exception("Unexpected error while deleting task comment.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
