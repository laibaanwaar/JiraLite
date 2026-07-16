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

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            result = AuthService.verify_email(token=serializer.validated_data["token"])
            return Response(result, status=status.HTTP_200_OK)
        except DRFValidationError as exc:
            return Response({"message": exc.detail}, status=status.HTTP_400_BAD_REQUEST)
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            return Response({"message": payload}, status=status.HTTP_400_BAD_REQUEST)
        except InvalidTokenError as exc:
            return Response({"message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except ExpiredTokenError as exc:
            return Response({"message": str(exc)}, status=status.HTTP_410_GONE)
        except Exception:
            logger.exception("Unexpected error during email verification.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
