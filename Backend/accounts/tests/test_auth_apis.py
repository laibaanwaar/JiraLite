from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.db import IntegrityError
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import EmailVerification
from accounts.services.email_service import VerificationEmailService


User = get_user_model()


class AuthApiTests(APITestCase):
    def setUp(self):
        self.signup_url = reverse("auth-signup")
        self.verify_url = reverse("auth-verify-email")
        self.resend_url = reverse("auth-resend-verification")
        self.login_url = reverse("auth-login")
        self.logout_url = reverse("auth-logout")

    def test_signup_success(self):
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                self.signup_url,
                {
                    "first_name": "Jane",
                    "last_name": "Doe",
                    "email": "  Jane.Doe@Example.com ",
                    "password": "VeryStrongPass123!",
                    "confirm_password": "VeryStrongPass123!",
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="jane.doe@example.com")
        self.assertFalse(user.is_email_verified)
        self.assertTrue(user.check_password("VeryStrongPass123!"))
        self.assertEqual(EmailVerification.objects.filter(user=user).count(), 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("token=", mail.outbox[0].body)

    def test_signup_rejects_duplicate_email_case_insensitive(self):
        User.objects.create_user(
            first_name="Existing",
            last_name="User",
            email="existing@example.com",
            password="ExistingPass123!",
        )
        response = self.client.post(
            self.signup_url,
            {
                "first_name": "Jane",
                "last_name": "Doe",
                "email": "EXISTING@example.com",
                "password": "VeryStrongPass123!",
                "confirm_password": "VeryStrongPass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_signup_rejects_mismatched_passwords(self):
        response = self.client.post(
            self.signup_url,
            {
                "first_name": "Jane",
                "last_name": "Doe",
                "email": "jane@example.com",
                "password": "VeryStrongPass123!",
                "confirm_password": "OtherPass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_rejects_weak_password(self):
        response = self.client.post(
            self.signup_url,
            {
                "first_name": "Jane",
                "last_name": "Doe",
                "email": "jane@example.com",
                "password": "123456789012",
                "confirm_password": "123456789012",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_returns_503_for_email_failure(self):
        with patch(
            "accounts.services.auth_service.transaction.on_commit",
            side_effect=lambda callback: callback(),
        ):
            with patch(
                "accounts.services.email_service.send_mail",
                side_effect=TimeoutError("smtp timeout"),
            ):
                response = self.client.post(
                    self.signup_url,
                    {
                        "first_name": "Jane",
                        "last_name": "Doe",
                        "email": "jane2@example.com",
                        "password": "VeryStrongPass123!",
                        "confirm_password": "VeryStrongPass123!",
                    },
                    format="json",
                )
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    def test_signup_returns_409_for_integrity_error(self):
        with patch(
            "accounts.services.auth_service.User.objects.create_user",
            side_effect=IntegrityError("duplicate"),
        ):
            response = self.client.post(
                self.signup_url,
                {
                    "first_name": "Jane",
                    "last_name": "Doe",
                    "email": "jane3@example.com",
                    "password": "VeryStrongPass123!",
                    "confirm_password": "VeryStrongPass123!",
                },
                format="json",
            )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_verify_email_success(self):
        user = User.objects.create_user(
            first_name="Pending",
            last_name="User",
            email="pending@example.com",
            password="PendingPass123!",
        )
        token = "raw-verify-token"
        verification = EmailVerification.objects.create(
            user=user,
            token_hash=VerificationEmailService.hash_token(token),
            expires_at=timezone.now() + timedelta(hours=1),
        )

        response = self.client.post(self.verify_url, {"token": token}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        verification.refresh_from_db()
        user.refresh_from_db()
        self.assertTrue(user.is_email_verified)
        self.assertIsNotNone(verification.used_at)

    def test_verify_email_rejects_invalid_token(self):
        response = self.client.post(self.verify_url, {"token": "invalid-token"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_email_rejects_expired_token(self):
        user = User.objects.create_user(
            first_name="Pending",
            last_name="User",
            email="expired@example.com",
            password="PendingPass123!",
        )
        token = "expired-token"
        EmailVerification.objects.create(
            user=user,
            token_hash=VerificationEmailService.hash_token(token),
            expires_at=timezone.now() - timedelta(minutes=1),
        )

        response = self.client.post(self.verify_url, {"token": token}, format="json")
        self.assertEqual(response.status_code, status.HTTP_410_GONE)

    def test_verify_email_handles_already_verified(self):
        user = User.objects.create_user(
            first_name="Verified",
            last_name="User",
            email="verified@example.com",
            password="VerifiedPass123!",
            is_email_verified=True,
        )
        token = "verified-token"
        EmailVerification.objects.create(
            user=user,
            token_hash=VerificationEmailService.hash_token(token),
            expires_at=timezone.now() + timedelta(hours=1),
        )
        response = self.client.post(self.verify_url, {"token": token}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verify_email_rejects_used_token(self):
        user = User.objects.create_user(
            first_name="Pending",
            last_name="User",
            email="used@example.com",
            password="PendingPass123!",
        )
        token = "used-token"
        EmailVerification.objects.create(
            user=user,
            token_hash=VerificationEmailService.hash_token(token),
            expires_at=timezone.now() + timedelta(hours=1),
            used_at=timezone.now(),
        )
        response = self.client.post(self.verify_url, {"token": token}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resend_verification_returns_generic_message_for_missing_user(self):
        response = self.client.post(
            self.resend_url,
            {"email": "missing@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["message"],
            "If the account is eligible, a verification email has been sent.",
        )

    def test_resend_verification_rotates_token(self):
        user = User.objects.create_user(
            first_name="Pending",
            last_name="User",
            email="pending2@example.com",
            password="PendingPass123!",
        )
        EmailVerification.objects.create(
            user=user,
            token_hash=VerificationEmailService.hash_token("old-token"),
            expires_at=timezone.now() + timedelta(hours=1),
        )

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                self.resend_url,
                {"email": "pending2@example.com"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(EmailVerification.objects.filter(user=user).count(), 2)
        self.assertEqual(
            EmailVerification.objects.filter(user=user, used_at__isnull=True).count(),
            1,
        )
        self.assertEqual(len(mail.outbox), 1)

    def test_resend_verification_rate_limit(self):
        user = User.objects.create_user(
            first_name="Pending",
            last_name="User",
            email="pending3@example.com",
            password="PendingPass123!",
        )
        self.client.post(self.resend_url, {"email": user.email}, format="json")
        response = self.client.post(self.resend_url, {"email": user.email}, format="json")
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_resend_verification_returns_503_for_email_failure(self):
        user = User.objects.create_user(
            first_name="Pending",
            last_name="User",
            email="pending4@example.com",
            password="PendingPass123!",
        )
        with patch(
            "accounts.services.auth_service.transaction.on_commit",
            side_effect=lambda callback: callback(),
        ):
            with patch(
                "accounts.services.email_service.send_mail",
                side_effect=TimeoutError("smtp timeout"),
            ):
                response = self.client.post(
                    self.resend_url,
                    {"email": user.email},
                    format="json",
                )
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    def test_login_success(self):
        user = User.objects.create_user(
            first_name="Sara",
            last_name="Ahmed",
            email="Sara@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )

        response = self.client.post(
            self.login_url,
            {"email": "  SARA@example.com ", "password": "UserPassword@123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["user"]["email"], user.email)
        user.refresh_from_db()
        self.assertIsNotNone(user.last_login)

    def test_login_rejects_invalid_credentials(self):
        User.objects.create_user(
            first_name="Sara",
            last_name="Ahmed",
            email="sara@example.com",
            password="UserPassword@123",
            is_email_verified=True,
        )
        response = self.client.post(
            self.login_url,
            {"email": "sara@example.com", "password": "WrongPassword@123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data["success"])

    def test_login_rejects_unverified_user(self):
        User.objects.create_user(
            first_name="Sara",
            last_name="Ahmed",
            email="sara2@example.com",
            password="UserPassword@123",
            is_email_verified=False,
        )
        response = self.client.post(
            self.login_url,
            {"email": "sara2@example.com", "password": "UserPassword@123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "EMAIL_NOT_VERIFIED")

    def test_login_rejects_inactive_user(self):
        User.objects.create_user(
            first_name="Sara",
            last_name="Ahmed",
            email="sara3@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=False,
        )
        response = self.client.post(
            self.login_url,
            {"email": "sara3@example.com", "password": "UserPassword@123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "ACCOUNT_INACTIVE")

    def test_login_rate_limit(self):
        User.objects.create_user(
            first_name="Sara",
            last_name="Ahmed",
            email="sara4@example.com",
            password="UserPassword@123",
            is_email_verified=True,
        )
        for _ in range(10):
            self.client.post(
                self.login_url,
                {"email": "sara4@example.com", "password": "WrongPassword@123"},
                format="json",
            )
        response = self.client.post(
            self.login_url,
            {"email": "sara4@example.com", "password": "WrongPassword@123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_logout_success(self):
        user = User.objects.create_user(
            first_name="Sara",
            last_name="Ahmed",
            email="logout@example.com",
            password="UserPassword@123",
            is_email_verified=True,
        )
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

        response = self.client.post(
            self.logout_url,
            {"refresh": str(refresh)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["message"], "Logout successful.")

    def test_logout_requires_authentication(self):
        response = self.client.post(
            self.logout_url,
            {"refresh": "some-token"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_other_users_refresh_token(self):
        user = User.objects.create_user(
            first_name="Sara",
            last_name="Ahmed",
            email="logout-owner@example.com",
            password="UserPassword@123",
            is_email_verified=True,
        )
        other_user = User.objects.create_user(
            first_name="Ali",
            last_name="Khan",
            email="logout-other@example.com",
            password="UserPassword@123",
            is_email_verified=True,
        )
        auth_refresh = RefreshToken.for_user(user)
        other_refresh = RefreshToken.for_user(other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(auth_refresh.access_token)}")

        response = self.client.post(
            self.logout_url,
            {"refresh": str(other_refresh)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_logout_rejects_invalid_token(self):
        user = User.objects.create_user(
            first_name="Sara",
            last_name="Ahmed",
            email="logout-safe@example.com",
            password="UserPassword@123",
            is_email_verified=True,
        )
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

        response = self.client.post(
            self.logout_url,
            {"refresh": "bad-token"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Invalid refresh token.")
