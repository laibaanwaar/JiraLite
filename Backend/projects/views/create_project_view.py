import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError, IntegrityError
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, PermissionDenied, ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import ProfileJWTAuthentication
from projects.serializers import CreateProjectSerializer, ProjectListSerializer
from projects.services.project_service import ProjectService


logger = logging.getLogger(__name__)


class CreateProjectView(APIView):
    authentication_classes = [ProfileJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, NotAuthenticated):
            return Response(
                {"success": False, "message": "Authentication credentials were not provided or are invalid.", "errors": {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if isinstance(exc, AuthenticationFailed):
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

    def get(self, request):
        try:
            access_error = self._validate_project_access(request)
            if access_error is not None:
                return access_error
            result = ProjectService.list_projects(user=request.user, params=request.query_params, request=request)
            serializer = ProjectListSerializer(result["data"]["results"], many=True)
            return Response(
                {
                    "success": True,
                    "message": result["message"],
                    "data": {
                        "count": result["data"]["count"],
                        "next": result["data"]["next"],
                        "previous": result["data"]["previous"],
                        "results": serializer.data,
                    },
                },
                status=status.HTTP_200_OK,
            )
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else {}
            message = "Invalid role filter." if "role" in payload else "Invalid query parameters."
            return Response(
                {"success": False, "message": message, "errors": payload},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DatabaseError:
            logger.exception("Database error while listing projects.")
        except Exception:
            logger.exception("Unexpected error while listing projects.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    def post(self, request):
        serializer = CreateProjectSerializer(data=request.data)
        try:
            access_error = self._validate_project_access(request)
            if access_error is not None:
                return access_error
            serializer.is_valid(raise_exception=True)
            result = ProjectService.create_project(user=request.user, **serializer.validated_data)
            return Response(result, status=status.HTTP_201_CREATED)
        except DRFValidationError as exc:
            return Response(
                {"success": False, "message": "Invalid input.", "errors": exc.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            message_payload = payload.get("message", ["Invalid input."]) if isinstance(payload, dict) else ["Invalid input."]
            message = message_payload[0] if isinstance(message_payload, list) and message_payload else "Invalid input."
            return Response(
                {"success": False, "message": message, "errors": payload if isinstance(payload, dict) else {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except PermissionDenied:
            return Response(
                {"success": False, "message": "You do not have permission to perform this action.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except IntegrityError:
            return Response(
                {"success": False, "message": "A conflict occurred while creating the project.", "errors": {}},
                status=status.HTTP_409_CONFLICT,
            )
        except DatabaseError:
            logger.exception("Database error while creating project.")
        except Exception:
            logger.exception("Unexpected error while creating project.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
