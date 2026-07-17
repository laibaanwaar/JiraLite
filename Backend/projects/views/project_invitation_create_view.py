import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError, IntegrityError
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import ProfileJWTAuthentication
from accounts.services.exceptions import EmailDeliveryError
from projects.serializers import ProjectInvitationCreateSerializer
from projects.services.project_service import ProjectNotFoundError, ProjectPermissionError, ProjectService


logger = logging.getLogger(__name__)


class ProjectInvitationCreateView(APIView):
    authentication_classes = [ProfileJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
            return Response(
                {"success": False, "message": "Authentication credentials were not provided or are invalid.", "errors": {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return super().handle_exception(exc)

    def post(self, request, project_id: int):
        serializer = ProjectInvitationCreateSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            result = ProjectService.create_project_invitation(
                user=request.user,
                project_id=project_id,
                **serializer.validated_data,
            )
            return Response(result, status=status.HTTP_201_CREATED)
        except DRFValidationError as exc:
            return Response(
                {"success": False, "message": "Invalid input.", "errors": exc.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else {"non_field_errors": exc.messages}
            return Response(
                {"success": False, "message": "Invalid input.", "errors": payload},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ProjectPermissionError:
            return Response(
                {"success": False, "message": "You are not allowed to send invitations for this project.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except ProjectNotFoundError:
            return Response(
                {"success": False, "message": "Project not found.", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except IntegrityError:
            return Response(
                {"success": False, "message": "This user is already a project member.", "errors": {}},
                status=status.HTTP_409_CONFLICT,
            )
        except EmailDeliveryError as exc:
            return Response(
                {"success": False, "message": str(exc), "errors": {}},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except DatabaseError:
            logger.exception("Database error while creating project invitation.")
        except Exception:
            logger.exception("Unexpected error while creating project invitation.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
