import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import DatabaseError, IntegrityError
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.serializers import InvitationAcceptSignupSerializer
from projects.services.project_service import ProjectService


logger = logging.getLogger(__name__)


class InvitationAcceptView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, token: str):
        try:
            preview = ProjectService.get_pending_invitation_details_by_token(token=token)
            logger.debug(
                "Invitation accept request: invited_email=%s account_exists=%s authenticated_user_email=%s status=%s",
                preview["data"].get("invited_email"),
                preview["data"].get("account_exists"),
                getattr(getattr(request, "user", None), "email", None),
                preview["data"].get("status"),
            )

            serializer = InvitationAcceptSignupSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            result = ProjectService.accept_invitation_for_new_user(token=token, **serializer.validated_data)
            return Response(result, status=status.HTTP_200_OK)
        except DRFValidationError as exc:
            return Response(
                {
                    "success": False,
                    "message": "Enter the required name and password fields to accept this invitation.",
                    "errors": exc.detail,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else {"non_field_errors": exc.messages}
            first_error = next(iter(payload.values()), ["Invitation acceptance input is invalid."])
            message = first_error[0] if isinstance(first_error, list) and first_error else "Invitation acceptance input is invalid."
            return Response(
                {"success": False, "message": message, "errors": payload},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except PermissionError:
            return Response(
                {
                    "success": False,
                    "message": "Log in with the invited email address to accept this invitation.",
                    "errors": {},
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        except IntegrityError:
            return Response(
                {"success": False, "message": "You are already a project member.", "errors": {}},
                status=status.HTTP_409_CONFLICT,
            )
        except DatabaseError:
            logger.exception("Database error while accepting invitation.")
        except Exception:
            logger.exception("Unexpected error while accepting invitation.")
        return Response(
            {"success": False, "message": "A server error occurred. Please try again later.", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
