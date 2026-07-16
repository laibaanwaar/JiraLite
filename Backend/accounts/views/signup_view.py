import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import SignupSerializer
from accounts.services.auth_service import AuthService
from accounts.services.exceptions import EmailDeliveryError, RateLimitError


logger = logging.getLogger(__name__)


class SignupView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = SignupSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            result = AuthService.signup(request=request, **serializer.validated_data)
            return Response(result, status=status.HTTP_201_CREATED)
        except DRFValidationError as exc:
            return Response({"message": exc.detail}, status=status.HTTP_400_BAD_REQUEST)
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            return Response({"message": payload}, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response(
                {"message": "An account with this email already exists."},
                status=status.HTTP_409_CONFLICT,
            )
        except RateLimitError as exc:
            return Response({"message": str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except EmailDeliveryError as exc:
            return Response({"message": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception:
            logger.exception("Unexpected error during signup.")
            return Response(
                {"message": "An unexpected error occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
