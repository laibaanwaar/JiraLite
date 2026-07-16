import logging

from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import LogoutSerializer
from accounts.services.auth_service import AuthService
from accounts.services.exceptions import InvalidRefreshTokenError, TokenOwnershipError


logger = logging.getLogger(__name__)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
            return Response(
                {
                    "success": False,
                    "message": "Authentication credentials were not provided or are invalid.",
                    "errors": {},
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return super().handle_exception(exc)

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            result = AuthService.logout(
                refresh_token=serializer.validated_data["refresh"],
                user=request.user,
            )
            return Response(result, status=status.HTTP_200_OK)
        except DRFValidationError as exc:
            return Response(
                {"success": False, "message": "Invalid input.", "errors": exc.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except InvalidRefreshTokenError:
            return Response(
                {"success": False, "message": "Invalid refresh token.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except TokenOwnershipError:
            return Response(
                {
                    "success": False,
                    "message": "Refresh token does not belong to the authenticated user.",
                    "errors": {},
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        except Exception:
            logger.exception("Unexpected error during logout.")
            return Response(
                {
                    "success": False,
                    "message": "A server error occurred. Please try again later.",
                    "errors": {},
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
