import logging

from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken


logger = logging.getLogger(__name__)


class LogoutService:

    @staticmethod
    def logout(refresh_token: str) -> None:
        """
        Blacklist the supplied refresh token so it cannot
        be used again to generate a new access token.
        """

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()

        except TokenError:
            raise ValidationError(
                {
                    "refresh": [
                        "Invalid or expired refresh token."
                    ]
                }
            )

        except Exception:
            logger.exception(
                "Unexpected error while logging out user."
            )

            raise ValidationError(
                {
                    "detail": (
                        "Unable to logout. Please try again."
                    )
                }
            )