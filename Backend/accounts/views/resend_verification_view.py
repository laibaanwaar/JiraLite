import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import ResendVerificationSerializer
from accounts.services.auth_service import AuthService
from accounts.services.exceptions import EmailDeliveryError, RateLimitError


logger = logging.getLogger(__name__)


class ResendVerificationView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            result = AuthService.resend_verification(
                email=serializer.validated_data["email"],
                request=request,
            )
            return Response(result, status=status.HTTP_200_OK)
        except DRFValidationError as exc:
            return Response({"message": exc.detail}, status=status.HTTP_400_BAD_REQUEST)
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            return Response({"message": payload}, status=status.HTTP_400_BAD_REQUEST)
        except RateLimitError as exc:
            return Response({"message": str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except EmailDeliveryError as exc:
            return Response({"message": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception:
            logger.exception("Unexpected error during resend verification.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
