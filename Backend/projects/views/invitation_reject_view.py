import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.services.project_service import ProjectService


logger = logging.getLogger(__name__)


class InvitationRejectView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, token: str):
        try:
            result = ProjectService.reject_invitation_by_token(token=token)
            return Response(result, status=status.HTTP_200_OK)
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else {"non_field_errors": exc.messages}
            return Response(
                {"success": False, "message": "Invalid input.", "errors": payload},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DatabaseError:
            logger.exception("Database error while rejecting invitation.")
        except Exception:
            logger.exception("Unexpected error while rejecting invitation.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
