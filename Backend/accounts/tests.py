import re

from django.contrib.auth.hashers import check_password
from django.core import mail
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import EmailVerificationOTP, User


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
)
class SignupOTPFlowTests(APITestCase):
    def test_signup_sends_otp_and_verifies_user(self):
        email = "signup-flow@example.com"
        password = "StrongPass123!"

        response = self.client.post(
            "/api/auth/signup/",
            {
                "first_name": "Sign",
                "last_name": "Up",
                "email": f"  {email.upper()}  ",
                "password": password,
                "confirm_password": password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)

        message = mail.outbox[0]
        self.assertEqual(message.to, [email])
        self.assertIn("Verify your JiraLite account", message.subject)

        otp_match = re.search(
            r"verification OTP is: (\d{6})",
            message.body,
        )
        self.assertIsNotNone(otp_match)
        otp = otp_match.group(1)

        user = User.objects.get(email=email)
        self.assertFalse(user.is_verified)
        self.assertFalse(user.is_active)

        otp_record = EmailVerificationOTP.objects.get(user=user)
        self.assertNotEqual(otp_record.otp_hash, otp)
        self.assertTrue(check_password(otp, otp_record.otp_hash))

        verify_response = self.client.post(
            "/api/auth/verify-otp/",
            {
                "email": f"  {email}  ",
                "otp": otp,
            },
            format="json",
        )

        self.assertEqual(
            verify_response.status_code,
            status.HTTP_200_OK,
        )

        user.refresh_from_db()
        self.assertTrue(user.is_verified)
        self.assertTrue(user.is_active)
        self.assertFalse(
            EmailVerificationOTP.objects.filter(user=user).exists()
        )
