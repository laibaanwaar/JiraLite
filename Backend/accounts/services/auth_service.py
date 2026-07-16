import logging
from typing import Any, cast

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import update_last_login
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import EmailVerification
from accounts.services.email_service import VerificationEmailService
from accounts.services.exceptions import (
    AccountInactiveError,
    EmailNotVerifiedError,
    ExpiredTokenError,
    InvalidCredentialsError,
    InvalidTokenError,
    InvalidRefreshTokenError,
    TokenOwnershipError,
)
from accounts.services.rate_limit_service import RateLimitService


logger = logging.getLogger(__name__)
User = get_user_model()


class AuthService:
    LOGIN_INPUT_MAX_LENGTH = 254
    PASSWORD_INPUT_MAX_LENGTH = 128

    @staticmethod
    def normalize_email(email: str) -> str:
        return (email or "").strip().lower()

    @staticmethod
    def get_client_ip(request) -> str:
        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "unknown")

    @staticmethod
    def signup(
        *,
        first_name: str,
        last_name: str,
        email: str,
        password: str,
        confirm_password: str,
        request,
    ) -> dict:
        normalized_email = AuthService.normalize_email(email)
        RateLimitService.check_signup_limits(
            email=normalized_email,
            ip_address=AuthService.get_client_ip(request),
        )

        if password != confirm_password:
            raise ValidationError({"confirm_password": ["Passwords do not match."]})

        validate_email(normalized_email)

        if cast(Any, User.objects).filter(email__iexact=normalized_email).exists():
            raise IntegrityError("Duplicate email.")

        probe_user = User(
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            email=normalized_email,
        )
        validate_password(password, user=probe_user)

        raw_token = VerificationEmailService.generate_token()
        token_hash = VerificationEmailService.hash_token(raw_token)
        expires_at = VerificationEmailService.get_expiry()

        with cast(Any, transaction).atomic():
            user = cast(Any, User.objects).create_user(
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                email=normalized_email,
                password=password,
                is_email_verified=False,
                is_active=True,
            )
            EmailVerification.objects.create(
                user=user,
                token_hash=token_hash,
                expires_at=expires_at,
                used_at=None,
            )
            transaction.on_commit(
                lambda: VerificationEmailService.send_verification_email(
                    recipient_email=user.email,
                    first_name=user.first_name,
                    token=raw_token,
                )
            )

        return {
            "message": "Signup successful. Please verify your email.",
            "data": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "is_email_verified": user.is_email_verified,
                "is_active": user.is_active,
            },
        }

    @staticmethod
    def login(*, email: str, password: str, request) -> dict:
        normalized_email = AuthService.normalize_email(email)
        RateLimitService.check_login_limits(
            email=normalized_email,
            ip_address=AuthService.get_client_ip(request),
        )

        validate_email(normalized_email)
        matched_user = cast(Any, User.objects).filter(email__iexact=normalized_email).first()

        user = authenticate(
            request=request,
            username=normalized_email,
            password=password,
        )

        if user is None:
            if matched_user and matched_user.check_password(password) and not matched_user.is_active:
                raise AccountInactiveError("Your account is inactive. Contact support.")
            raise InvalidCredentialsError("Invalid email or password.")

        if not user.is_email_verified:
            raise EmailNotVerifiedError("Please verify your email before logging in.")

        if not user.is_active:
            raise AccountInactiveError("Your account is inactive. Contact support.")

        refresh = RefreshToken.for_user(user)
        update_last_login(None, user)

        return {
            "success": True,
            "message": "Login successful.",
            "data": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "access_expires_in": 1800,
                "session_expires_in": 86400,
                "user": {
                    "id": user.id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "is_email_verified": user.is_email_verified,
                    "is_active": user.is_active,
                },
            },
        }

    @staticmethod
    def verify_email(*, token: str) -> dict:
        normalized_token = token.strip()
        if not normalized_token:
            raise InvalidTokenError("Invalid verification token.")

        token_hash = VerificationEmailService.hash_token(normalized_token)

        with cast(Any, transaction).atomic():
            try:
                verification = cast(Any, EmailVerification.objects).select_for_update().select_related("user").get(
                    token_hash=token_hash
                )
            except ObjectDoesNotExist as exc:
                raise InvalidTokenError("Invalid verification token.") from exc

            user = verification.user
            if user is None or not user.is_active:
                raise InvalidTokenError("Invalid verification token.")

            if user.is_email_verified:
                return {"message": "Email is already verified."}

            if verification.used_at is not None:
                raise InvalidTokenError("This verification token is no longer valid.")

            if verification.expires_at <= timezone.now():
                raise ExpiredTokenError(
                    "This verification token has expired. Please request a new one."
                )

            verification.used_at = timezone.now()
            verification.save(update_fields=["used_at"])
            user.is_email_verified = True
            user.save(update_fields=["is_email_verified"])

        return {"message": "Email verified successfully."}

    @staticmethod
    def resend_verification(*, email: str, request) -> dict:
        normalized_email = AuthService.normalize_email(email)
        RateLimitService.check_resend_ip_limit(
            ip_address=AuthService.get_client_ip(request),
        )

        response = {
            "message": "If the account is eligible, a verification email has been sent."
        }

        try:
            user = cast(Any, User.objects).get(email__iexact=normalized_email)
        except ObjectDoesNotExist:
            return response

        if user.is_email_verified or not user.is_active:
            return response

        RateLimitService.check_resend_email_limits(email=normalized_email)

        raw_token = VerificationEmailService.generate_token()
        token_hash = VerificationEmailService.hash_token(raw_token)
        expires_at = VerificationEmailService.get_expiry()

        with cast(Any, transaction).atomic():
            cast(Any, EmailVerification.objects).filter(
                user=user,
                used_at__isnull=True,
            ).update(used_at=timezone.now())
            EmailVerification.objects.create(
                user=user,
                token_hash=token_hash,
                expires_at=expires_at,
                used_at=None,
            )
            transaction.on_commit(
                lambda: VerificationEmailService.send_verification_email(
                    recipient_email=user.email,
                    first_name=user.first_name,
                    token=raw_token,
                )
            )

        return response

    @staticmethod
    def logout(*, refresh_token: str, user) -> dict:
        try:
            token = RefreshToken(refresh_token.strip())
        except TokenError as exc:
            message = str(exc).lower()
            if "blacklisted" in message or "expired" in message:
                return {
                    "success": True,
                    "message": "You are already logged out.",
                    "data": None,
                }
            raise InvalidRefreshTokenError("Invalid refresh token.") from exc

        token_user_id = token.get("user_id")
        try:
            normalized_token_user_id = int(token_user_id)
        except (TypeError, ValueError):
            raise InvalidRefreshTokenError("Invalid refresh token.")
        if normalized_token_user_id != user.id:
            raise TokenOwnershipError("Refresh token does not belong to the authenticated user.")

        try:
            token.blacklist()
        except TokenError as exc:
            message = str(exc).lower()
            if "blacklisted" in message or "expired" in message:
                return {
                    "success": True,
                    "message": "You are already logged out.",
                    "data": None,
                }
            raise InvalidRefreshTokenError("Invalid refresh token.") from exc

        return {
            "success": True,
            "message": "Logout successful.",
            "data": None,
        }
