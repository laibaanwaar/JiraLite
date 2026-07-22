import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import (
    check_password,
    make_password,
)
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import APIException

from .models import EmailVerificationOTP, User


logger = logging.getLogger(__name__)

OTP_EXPIRY_MINUTES = settings.EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES
MAX_OTP_ATTEMPTS = 5
RESEND_OTP_COOLDOWN_SECONDS = 60

class EmailDeliveryError(APIException):
    status_code = 503
    default_detail = (
        "OTP email could not be sent. Please try again."
    )
    default_code = "email_delivery_failed"


def generate_six_digit_otp() -> str:
    """
    Generate a cryptographically secure six-digit OTP.
    """

    return f"{secrets.randbelow(900000) + 100000:06d}"


@transaction.atomic
def register_user_and_send_otp(validated_data: dict) -> User:
    email = validated_data["email"].strip().lower()

    user = User.objects.filter(email=email).first()

    if user and user.is_verified:
        raise serializers.ValidationError(
            {
                "email": (
                    "An account with this email already exists."
                )
            }
        )

    if user is None:
        user = User.objects.create_user(
            email=email,
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            is_active=False,
            is_verified=False,
        )
    else:
        # Update an existing unverified registration.
        user.first_name = validated_data["first_name"]
        user.last_name = validated_data["last_name"]
        user.is_active = False
        user.is_verified = False
        user.set_password(validated_data["password"])

        user.save(
            update_fields=[
                "first_name",
                "last_name",
                "password",
                "is_active",
                "is_verified",
            ]
        )

    raw_otp = generate_six_digit_otp()

    EmailVerificationOTP.objects.update_or_create(
        user=user,
        defaults={
            "otp_hash": make_password(raw_otp),
            "expires_at": (
                timezone.now()
                + timedelta(minutes=OTP_EXPIRY_MINUTES)
            ),
            "attempts": 0,
        },
    )

    try:
        send_result = send_mail(
            subject="Verify your JiraLite account",
            message=(
                f"Hello {user.first_name},\n\n"
                f"Your JiraLite verification OTP is: {raw_otp}\n\n"
                f"This OTP expires in "
                f"{OTP_EXPIRY_MINUTES} minutes.\n\n"
                "Do not share this OTP with anyone."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as exc:
        # The atomic transaction is rolled back if email sending fails.
        raise EmailDeliveryError() from exc
    if send_result != 1:
        raise EmailDeliveryError()

    if settings.DEBUG:
        logger.debug(
            "OTP email send result=%s recipient=%s",
            send_result,
            email,
        )

    return user

#---
@transaction.atomic
def resend_verification_otp(email: str) -> User:
    normalized_email = email.strip().lower()

    try:
        user = User.objects.select_for_update().get(
            email=normalized_email
        )
    except User.DoesNotExist as exc:
        raise serializers.ValidationError(
            {
                "email": "No pending signup exists for this email."
            }
        ) from exc

    if user.is_verified:
        raise serializers.ValidationError(
            {
                "email": "This email is already verified."
            }
        )

    otp_record = (
        EmailVerificationOTP.objects
        .select_for_update()
        .filter(user=user)
        .first()
    )

    if otp_record:
        next_resend_time = (
            otp_record.updated_at
            + timedelta(seconds=RESEND_OTP_COOLDOWN_SECONDS)
        )

        if timezone.now() < next_resend_time:
            remaining_seconds = max(
                int(
                    (
                        next_resend_time
                        - timezone.now()
                    ).total_seconds()
                ),
                1,
            )

            raise serializers.ValidationError(
                {
                    "email": (
                        f"Please wait {remaining_seconds} seconds "
                        "before requesting another OTP."
                    )
                }
            )

    raw_otp = generate_six_digit_otp()

    EmailVerificationOTP.objects.update_or_create(
        user=user,
        defaults={
            "otp_hash": make_password(raw_otp),
            "expires_at": (
                timezone.now()
                + timedelta(minutes=OTP_EXPIRY_MINUTES)
            ),
            "attempts": 0,
        },
    )

    try:
        send_result = send_mail(
            subject="Your new JiraLite verification OTP",
            message=(
                f"Hello {user.first_name},\n\n"
                f"Your new JiraLite verification OTP is: "
                f"{raw_otp}\n\n"
                f"This OTP expires in "
                f"{OTP_EXPIRY_MINUTES} minutes.\n\n"
                "Do not share this OTP with anyone."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[normalized_email],
            fail_silently=False,
        )
    except Exception as exc:
        raise EmailDeliveryError() from exc
    if send_result != 1:
        raise EmailDeliveryError()

    if settings.DEBUG:
        logger.debug(
            "Resend OTP email send result=%s recipient=%s",
            send_result,
            normalized_email,
        )

    return user

@transaction.atomic
# CHANGED:
# We use transaction.atomic() inside the function.
# This allows an invalid OTP attempt to be committed
# before returning the 400 validation error.

def verify_email_otp(email: str, raw_otp: str) -> User:
    invalid_otp_error = None

    with transaction.atomic():
        try:
            user = User.objects.select_for_update().get(
                email=email.strip().lower()
            )
        except User.DoesNotExist as exc:
            raise serializers.ValidationError(
                {
                    "email": (
                        "No pending signup exists for this email."
                    )
                }
            ) from exc

        if user.is_verified:
            raise serializers.ValidationError(
                {
                    "email": "This email is already verified."
                }
            )

        try:
            otp_record = (
                EmailVerificationOTP.objects
                .select_for_update()
                .get(user=user)
            )
        except EmailVerificationOTP.DoesNotExist as exc:
            raise serializers.ValidationError(
                {
                    "otp": (
                        "No verification OTP exists. "
                        "Please request another OTP."
                    )
                }
            ) from exc

        if otp_record.is_expired():
            raise serializers.ValidationError(
                {
                    "otp": (
                        "OTP has expired. "
                        "Please request another OTP."
                    )
                }
            )

        if otp_record.attempts >= MAX_OTP_ATTEMPTS:
            raise serializers.ValidationError(
                {
                    "otp": (
                        "Maximum OTP attempts exceeded. "
                        "Please request another OTP."
                    )
                }
            )

        # Invalid OTP
        if not check_password(
            raw_otp,
            otp_record.otp_hash,
        ):
            otp_record.attempts += 1

            otp_record.save(
                update_fields=[
                    "attempts",
                    "updated_at",
                ]
            )

            remaining_attempts = (
                MAX_OTP_ATTEMPTS
                - otp_record.attempts
            )

            # Store error instead of raising it
            # while still inside the transaction.
            invalid_otp_error = {
                "otp": (
                    "Invalid OTP. "
                    f"{remaining_attempts} attempts remaining."
                )
            }

        else:
            # Correct OTP
            user.is_verified = True
            user.is_active = True

            user.save(
                update_fields=[
                    "is_verified",
                    "is_active",
                ]
            )

            otp_record.delete()

            return user

    # Raise error AFTER transaction commits,
    # so invalid attempt count remains saved.
    if invalid_otp_error:
        raise serializers.ValidationError(
            invalid_otp_error
        )