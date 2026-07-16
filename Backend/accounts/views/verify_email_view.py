import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import VerifyEmailSerializer
from accounts.services.auth_service import AuthService
from accounts.services.exceptions import ExpiredTokenError, InvalidTokenError


logger = logging.getLogger(__name__)


class VerifyEmailView(APIView):
    authentication_classes = []
    permission_classes = []

    @staticmethod
    def _build_validation_response(payload):
        if "code" in payload:
            first_error = payload["code"][0] if isinstance(payload["code"], list) and payload["code"] else ""
            if first_error == "Request a new verification code.":
                return Response(
                    {
                        "message": "Verification code has expired.",
                        "errors": {"code": ["Request a new verification code."]},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if first_error == "The verification code is incorrect.":
                return Response(
                    {
                        "message": "Invalid verification code.",
                        "errors": {"code": ["The verification code is incorrect."]},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(
            {"message": "Validation failed.", "errors": payload},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            result = AuthService.verify_email(
                email=serializer.validated_data["email"],
                code=serializer.validated_data["code"],
            )
            return Response(result, status=status.HTTP_200_OK)
        except DRFValidationError as exc:
            return self._build_validation_response(exc.detail)
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            return self._build_validation_response(payload if isinstance(payload, dict) else {})
        except InvalidTokenError as exc:
            return Response(
                {"message": str(exc), "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ExpiredTokenError as exc:
            return Response(
                {"message": str(exc), "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            logger.exception("Unexpected error during email verification.")
            return Response(
                {
                    "message": "A server error occurred. Please try again later.",
                    "errors": {},
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
