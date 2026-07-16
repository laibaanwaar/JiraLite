import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError, IntegrityError
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import ProfileJWTAuthentication
from projects.serializers import ProjectListSerializer, UpdateProjectSerializer
from projects.services.project_service import ProjectNotFoundError, ProjectPermissionError, ProjectService


logger = logging.getLogger(__name__)


class ProjectDetailView(APIView):
    authentication_classes = [ProfileJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
            return Response(
                {"success": False, "message": "Authentication credentials were not provided or are invalid.", "errors": {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return super().handle_exception(exc)

    def _validate_project_access(self, request):
        if not request.user.is_active:
            return Response(
                {"success": False, "message": "User account is inactive.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not getattr(request.user, "is_email_verified", False):
            return Response(
                {"success": False, "message": "Email verification is required.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def get(self, request, project_id: int):
        try:
            access_error = self._validate_project_access(request)
            if access_error is not None:
                return access_error
            membership = ProjectService.get_project_detail(user=request.user, project_id=project_id)
            serializer = ProjectListSerializer(membership)
            return Response(
                {"success": True, "message": "Project retrieved successfully.", "data": serializer.data},
                status=status.HTTP_200_OK,
            )
        except ProjectPermissionError:
            return Response(
                {"success": False, "message": "You are not allowed to access this project.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except ProjectNotFoundError:
            return Response(
                {"success": False, "message": "Project not found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except DatabaseError:
            logger.exception("Database error while retrieving project.")
        except Exception:
            logger.exception("Unexpected error while retrieving project.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    def patch(self, request, project_id: int):
        serializer = UpdateProjectSerializer(data=request.data, partial=True)
        try:
            access_error = self._validate_project_access(request)
            if access_error is not None:
                return access_error
            serializer.is_valid(raise_exception=True)
            membership = ProjectService.update_project(
                user=request.user,
                project_id=project_id,
                validated_data=serializer.validated_data,
            )
            response_serializer = ProjectListSerializer(membership)
            return Response(
                {"success": True, "message": "Project updated successfully.", "data": response_serializer.data},
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
        except ProjectPermissionError:
            return Response(
                {"success": False, "message": "You do not have permission to update this project.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except ProjectNotFoundError:
            return Response(
                {"success": False, "message": "Project not found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except IntegrityError:
            return Response(
                {"success": False, "message": "A conflict occurred while updating the project.", "errors": {}},
                status=status.HTTP_409_CONFLICT,
            )
        except DatabaseError:
            logger.exception("Database error while updating project.")
        except Exception:
            logger.exception("Unexpected error while updating project.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    def delete(self, request, project_id: int):
        try:
            access_error = self._validate_project_access(request)
            if access_error is not None:
                return access_error
            ProjectService.delete_project(user=request.user, project_id=project_id)
            return Response(
                {"success": True, "message": "Project deleted successfully.", "data": None},
                status=status.HTTP_200_OK,
            )
        except ProjectPermissionError:
            return Response(
                {"success": False, "message": "You do not have permission to delete this project.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except ProjectNotFoundError:
            return Response(
                {"success": False, "message": "Project not found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except DatabaseError:
            logger.exception("Database error while deleting project.")
        except Exception:
            logger.exception("Unexpected error while deleting project.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
