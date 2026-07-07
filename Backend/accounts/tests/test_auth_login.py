from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models.role import Role


User = get_user_model()


class LoginApiTests(APITestCase):
    def setUp(self):
        self.role = Role.objects.create(
            name="Engineer",
            code="engineer",
            description="Engineer role",
        )
        self.user = User.objects.create_user(
            email="john@example.com",
            password="StrongPass123!",
            first_name="John",
            last_name="Doe",
            role=self.role,
        )
        self.url = reverse("auth-login")

    def test_login_success(self):
        response = self.client.post(
            self.url,
            {"email": "john@example.com", "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])
        self.assertEqual(response.data["data"]["user"]["email"], "john@example.com")

    def test_login_requires_email(self):
        response = self.client.post(
            self.url,
            {"password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_requires_password(self):
        response = self.client.post(
            self.url,
            {"email": "john@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post(
            self.url,
            {"email": "john@example.com", "password": "WrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_rejects_inactive_user(self):
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])

        response = self.client.post(
            self.url,
            {"email": "john@example.com", "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_rejects_inactive_role(self):
        self.role.is_active = False
        self.role.save(update_fields=["is_active"])

        response = self.client.post(
            self.url,
            {"email": "john@example.com", "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
