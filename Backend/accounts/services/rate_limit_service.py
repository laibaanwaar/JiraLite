from django.conf import settings
from django.core.cache import cache

from accounts.services.exceptions import RateLimitError


class RateLimitService:
    @staticmethod
    def _hit(key: str, limit: int, ttl_seconds: int, message: str) -> None:
        value = cache.get(key)
        if value is None:
            cache.set(key, 1, ttl_seconds)
            return

        value = int(value) + 1
        cache.set(key, value, ttl_seconds)
        if value > limit:
            raise RateLimitError(message)

    @staticmethod
    def check_signup_limits(*, email: str, ip_address: str) -> None:
        email_limit = getattr(settings, "SIGNUP_EMAIL_LIMIT_PER_HOUR", 10)
        ip_limit = getattr(settings, "SIGNUP_IP_LIMIT_PER_HOUR", 25)
        RateLimitService._hit(
            f"signup-email:{email}",
            limit=email_limit,
            ttl_seconds=3600,
            message="Too many signup attempts. Please try again later.",
        )
        RateLimitService._hit(
            f"signup-ip:{ip_address}",
            limit=ip_limit,
            ttl_seconds=3600,
            message="Too many signup attempts. Please try again later.",
        )

    @staticmethod
    def check_login_limits(*, email: str, ip_address: str) -> None:
        email_limit = getattr(settings, "LOGIN_EMAIL_LIMIT_PER_MINUTE", 10)
        ip_limit = getattr(settings, "LOGIN_IP_LIMIT_PER_MINUTE", 20)
        RateLimitService._hit(
            f"login-email:{email}",
            limit=email_limit,
            ttl_seconds=60,
            message="Too many login attempts. Please try again later.",
        )
        RateLimitService._hit(
            f"login-ip:{ip_address}",
            limit=ip_limit,
            ttl_seconds=60,
            message="Too many login attempts. Please try again later.",
        )

    @staticmethod
    def check_resend_ip_limit(*, ip_address: str) -> None:
        ip_hour_limit = getattr(settings, "RESEND_VERIFICATION_IP_LIMIT_PER_HOUR", 20)
        RateLimitService._hit(
            f"resend-ip-hour:{ip_address}",
            limit=ip_hour_limit,
            ttl_seconds=3600,
            message="Too many OTP requests. Please try again later.",
        )

    @staticmethod
    def check_resend_email_limits(*, email: str) -> None:
        cooldown_seconds = getattr(settings, "RESEND_VERIFICATION_COOLDOWN_SECONDS", 60)
        email_hour_limit = getattr(settings, "RESEND_VERIFICATION_EMAIL_LIMIT_PER_HOUR", 5)
        RateLimitService._hit(
            f"resend-cooldown:{email}",
            limit=1,
            ttl_seconds=cooldown_seconds,
            message="Please wait before requesting another OTP.",
        )
        RateLimitService._hit(
            f"resend-email-hour:{email}",
            limit=email_hour_limit,
            ttl_seconds=3600,
            message="Too many OTP requests. Please try again later.",
        )
