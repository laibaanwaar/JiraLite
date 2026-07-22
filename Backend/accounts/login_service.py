import logging

from django.contrib.auth import get_user_model
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken


logger = logging.getLogger(__name__)

User = get_user_model()


INVALID_CREDENTIALS_MESSAGE = "Invalid email or password."


class LoginService:
    """
    Contains business logic for user authentication.

    Responsibilities:
    - Find user by normalized email
    - Verify password securely
    - Check account status
    - Generate JWT tokens
    - Return only safe user information
    """

    @staticmethod
    def authenticate_user(email: str, password: str):
        normalized_email = email.strip().lower()

        try:
            user = User.objects.filter(
                email__iexact=normalized_email
            ).first()

            # Do not reveal whether the email exists.
            if user is None:
                raise AuthenticationFailed(
                    INVALID_CREDENTIALS_MESSAGE
                )

            # Django securely compares entered password
            # with the stored password hash.
            if not user.check_password(password):
                raise AuthenticationFailed(
                    INVALID_CREDENTIALS_MESSAGE
                )

            # Do not allow disabled/inactive accounts.
            # Keep the error generic to avoid leaking account status.
            if not user.is_active:
                raise AuthenticationFailed(
                    INVALID_CREDENTIALS_MESSAGE
                )

            return user

        except AuthenticationFailed:
            # Preserve expected authentication errors.
            raise

        except Exception:
            logger.exception(
                "Unexpected error occurred while authenticating user."
            )

            raise AuthenticationFailed(
                "Unable to process login request. Please try again."
            )

    @staticmethod
    def generate_tokens(user):
        """
        Generate refresh and access JWT tokens.
        """

        try:
            refresh = RefreshToken.for_user(user)

            return {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }

        except Exception:
            logger.exception(
                "Failed to generate authentication tokens "
                "for user_id=%s",
                user.pk,
            )

            raise AuthenticationFailed(
                "Unable to create authentication session."
            )

    @classmethod
    def login(cls, email: str, password: str):
        """
        Complete login workflow.
        """

        user = cls.authenticate_user(
            email=email,
            password=password,
        )

        tokens = cls.generate_tokens(user)

        # Only safe information is returned.
        # Never return:
        # - password
        # - password hash
        # - secret fields
        # - global ADMIN/MEMBER role
        user_data = {
            "id": str(user.pk),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
        }

        return {
            "user": user_data,
            "tokens": tokens,
        }