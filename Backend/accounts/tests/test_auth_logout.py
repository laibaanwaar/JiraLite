from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APITestCase

from accounts.models.role import Role


User = get_user_model()


class LogoutApiTests(APITestCase):
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
        self.url = reverse("auth-logout")
        self.refresh_token = str(RefreshToken.for_user(self.user))

    def test_logout_success(self):
        response = self.client.post(
            self.url,
            {"refresh": self.refresh_token},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_requires_token(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_rejects_null_token(self):
        response = self.client.post(self.url, {"refresh": None}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_rejects_blank_token(self):
        response = self.client.post(self.url, {"refresh": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_rejects_spaces_only_token(self):
        response = self.client.post(self.url, {"refresh": "   "}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_rejects_access_token(self):
        access_token = str(RefreshToken.for_user(self.user).access_token)
        response = self.client.post(self.url, {"refresh": access_token}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_malformed_token(self):
        response = self.client.post(self.url, {"refresh": "abc.def"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_tampered_token(self):
        token_parts = self.refresh_token.split(".")
        token_parts[-1] = "tampered-signature"
        response = self.client.post(
            self.url,
            {"refresh": ".".join(token_parts)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_expired_token(self):
        expired_token = RefreshToken.for_user(self.user)
        expired_token["exp"] = 1
        response = self.client.post(
            self.url,
            {"refresh": str(expired_token)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_is_idempotent(self):
        first_response = self.client.post(
            self.url,
            {"refresh": self.refresh_token},
            format="json",
        )
        second_response = self.client.post(
            self.url,
            {"refresh": self.refresh_token},
            format="json",
        )
        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)

