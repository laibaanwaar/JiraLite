import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.services.project_service import ProjectService


logger = logging.getLogger(__name__)


class InvitationDetailView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, token: str):
        try:
            logger.debug(
                "Invitation detail request: authenticated_user_email=%s",
                getattr(getattr(request, "user", None), "email", None),
            )
            result = ProjectService.get_pending_invitation_details_by_token(token=token)
            return Response(result, status=status.HTTP_200_OK)
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else {"non_field_errors": exc.messages}
            first_error = next(iter(payload.values()), ["Invitation is not available."])
            message = first_error[0] if isinstance(first_error, list) and first_error else "Invitation is not available."
            return Response(
                {"success": False, "message": message, "errors": payload},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DatabaseError:
            logger.exception("Database error while retrieving invitation.")
        except Exception:
            logger.exception("Unexpected error while retrieving invitation.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
