import hashlib
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from accounts.services.exceptions import EmailDeliveryError


logger = logging.getLogger(__name__)


class VerificationEmailService:
    @staticmethod
    def generate_otp() -> str:
        return f"{secrets.randbelow(1_000_000):06d}"

    @staticmethod
    def hash_otp(otp: str) -> str:
        return hashlib.sha256(otp.encode("utf-8")).hexdigest()

    @staticmethod
    def get_expiry():
        return timezone.now() + timedelta(
            minutes=getattr(settings, "EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES", 10)
        )

    @staticmethod
    def send_verification_email(*, recipient_email: str, first_name: str, otp: str) -> None:
        subject = "Verify your email"
        greeting = first_name or "there"
        message = (
            f"Hi {greeting},\n\n"
            "Use this 6-digit OTP to verify your email address:\n"
            f"{otp}\n\n"
            f"This OTP will expire in {getattr(settings, 'EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES', 10)} minutes.\n\n"
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
