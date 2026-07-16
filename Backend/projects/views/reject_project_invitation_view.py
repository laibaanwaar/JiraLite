import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.serializers import AcceptProjectInvitationSerializer
from projects.services.project_service import ProjectService


logger = logging.getLogger(__name__)


class RejectProjectInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
            return Response(
                {"success": False, "message": "Authentication credentials were not provided or are invalid.", "errors": {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return super().handle_exception(exc)

    def post(self, request):
        serializer = AcceptProjectInvitationSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            result = ProjectService.reject_invitation(
                user=request.user,
                token=serializer.validated_data["token"],
            )
            return Response(result, status=status.HTTP_200_OK)
        except DRFValidationError as exc:
            return Response(
                {"success": False, "message": "Invalid input.", "errors": exc.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            return Response(
                {"success": False, "message": "Invalid input.", "errors": payload if isinstance(payload, dict) else {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except PermissionError:
            return Response(
                {"success": False, "message": "You are not allowed to reject this invitation.", "errors": {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except DatabaseError:
            logger.exception("Database error while rejecting invitation.")
        except Exception:
            logger.exception("Unexpected error while rejecting invitation.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
