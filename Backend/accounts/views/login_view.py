import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import LoginSerializer
from accounts.services.auth_service import AuthService
from accounts.services.exceptions import (
    AccountInactiveError,
    EmailNotVerifiedError,
    InvalidCredentialsError,
    RateLimitError,
)


logger = logging.getLogger(__name__)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            result = AuthService.login(request=request, **serializer.validated_data)
            return Response(result, status=status.HTTP_200_OK)
        except DRFValidationError as exc:
            return Response(
                {"success": False, "message": "Invalid input.", "errors": exc.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DjangoValidationError as exc:
            payload = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            return Response(
                {"success": False, "message": "Invalid input.", "errors": payload},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except InvalidCredentialsError:
            return Response(
                {"success": False, "message": "Invalid email or password.", "errors": {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except EmailNotVerifiedError:
            return Response(
                {
                    "success": False,
                    "message": "Please verify your email before logging in.",
                    "code": "EMAIL_NOT_VERIFIED",
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        except AccountInactiveError:
            return Response(
                {
                    "success": False,
                    "message": "Your account is inactive. Contact support.",
                    "code": "ACCOUNT_INACTIVE",
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        except RateLimitError as exc:
            return Response(
                {"success": False, "message": str(exc), "errors": {}},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        except Exception:
            logger.exception("Unexpected error during login.")
            return Response(
                {
                    "success": False,
                    "message": "A server error occurred. Please try again later.",
                    "errors": {},
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
