import hashlib
import logging
import secrets
from datetime import timedelta
from urllib.parse import urlencode

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from accounts.services.exceptions import EmailDeliveryError


logger = logging.getLogger(__name__)


class VerificationEmailService:
    @staticmethod
    def generate_token() -> str:
        return secrets.token_urlsafe(32)

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    @staticmethod
    def get_expiry():
        return timezone.now() + timedelta(
            hours=getattr(settings, "EMAIL_VERIFICATION_EXPIRY_HOURS", 24)
        )

    @staticmethod
    def build_link(token: str) -> str:
        base_url = getattr(settings, "FRONTEND_VERIFY_EMAIL_URL", "").strip()
        if not base_url:
            frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
            base_url = f"{frontend_url}/verify-email"
        separator = "&" if "?" in base_url else "?"
        return f"{base_url}{separator}{urlencode({'token': token})}"

    @staticmethod
    def send_verification_email(*, recipient_email: str, first_name: str, token: str) -> None:
        link = VerificationEmailService.build_link(token)
        subject = "Verify your email"
        greeting = first_name or "there"
        message = (
            f"Hi {greeting},\n\n"
            "Please verify your email address by opening this link:\n"
            f"{link}\n\n"
            "If you need to verify manually, use this token:\n"
            f"{token}\n\n"
            "If you did not create this account, you can ignore this email."
        )
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[recipient_email],
                fail_silently=False,
            )
        except Exception as exc:
            logger.warning(
                "Verification email delivery failed.",
                exc_info=exc,
            )
            raise EmailDeliveryError(
                "Verification email service is temporarily unavailable."
            ) from exc
