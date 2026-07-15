from typing import Any, cast

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models.role import Role


User = get_user_model()


class CreateUserApiTests(APITestCase):
    """Tests for POST /api/users/."""

    def setUp(self):
        self.admin_role = Role.objects.create(
            name="Admin",
            code="admin",
            description="Administrator role",
            is_active=True,
        )
        self.engineer_role = Role.objects.create(
            name="Engineer",
            code="engineer",
            description="Engineer role",
            is_active=True,
        )
        self.admin_user = cast(Any, User.objects).create_user(
            email="admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            last_name="User",
            role=self.admin_role,
            is_active=True,
        )
        self.url = reverse("user-list")

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def _payload(self, **overrides):
        base = {
            "first_name": "Ali",
            "last_name": "Khan",
            "email": "ali@example.com",
            "password": "Ali@12345",
            "role_id": self.engineer_role.id,
        }
        base.update(overrides)
        return base

    def test_create_user_success(self):
        self._auth()
        response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["message"], "User created successfully.")
        self.assertEqual(response.data["data"]["email"], "ali@example.com")
        self.assertNotIn("password", response.data["data"])

    def test_unauthenticated_request_rejected(self):
        response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["message"], "Unauthorized.")

    def test_non_admin_role_rejected(self):
        engineer_user = cast(Any, User.objects).create_user(
            email="eng@example.com",
            password="Engineer123!",
            first_name="Eng",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self._auth(engineer_user)
        response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "Permission denied.")

    def test_inactive_admin_rejected(self):
        self.admin_user.is_active = False
        self.admin_user.save(update_fields=["is_active"])
        self._auth()
        response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "Permission denied.")

    def test_duplicate_email_rejected(self):
        self._auth()
        self.client.post(self.url, self._payload(), format="json")
        response = self.client.post(self.url, self._payload(email="ALI@example.com"), format="json")

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["message"], "Email already exists.")

    def test_invalid_role_rejected(self):
        self._auth()
        response = self.client.post(self.url, self._payload(role_id=9999), format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["message"], "Invalid role.")

    def test_inactive_role_rejected(self):
        self.engineer_role.is_active = False
        self.engineer_role.save(update_fields=["is_active"])
        self._auth()
        response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Selected role is inactive.")

    def test_missing_email_returns_validation_envelope(self):
        self._auth()
        payload = self._payload()
        del payload["email"]
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Validation failed.")
        self.assertIn("email", response.data["errors"])

    def test_blank_first_name_returns_validation_envelope(self):
        self._auth()
        response = self.client.post(self.url, self._payload(first_name="   "), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Validation failed.")
        self.assertIn("first_name", response.data["errors"])

    def test_invalid_email_returns_validation_envelope(self):
        self._auth()
        response = self.client.post(self.url, self._payload(email="not-an-email"), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Validation failed.")
        self.assertIn("email", response.data["errors"])

    def test_weak_password_returns_security_message(self):
        self._auth()
        response = self.client.post(self.url, self._payload(password="12345678"), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Password does not meet security requirements.")

    def test_unexpected_field_rejected(self):
        self._auth()
        response = self.client.post(
            self.url,
            {**self._payload(), "unknown_field": "value"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Validation failed.")

    def test_invalid_json_body_rejected(self):
        self._auth()
        response = self.client.post(
            self.url,
            "not json",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Validation failed.")
