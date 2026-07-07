from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APITestCase

from accounts.models.role import Role


User = get_user_model()


class RefreshApiTests(APITestCase):
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
        self.url = reverse("auth-refresh")
        self.refresh_token = str(RefreshToken.for_user(self.user))

    def test_refresh_success(self):
        response = self.client.post(
            self.url,
            {"refresh": self.refresh_token},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data["data"])

    def test_refresh_requires_token(self):
        response = self.client.post(
            self.url,
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_rejects_null_token(self):
        response = self.client.post(
            self.url,
            {"refresh": None},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_rejects_blank_token(self):
        response = self.client.post(
            self.url,
            {"refresh": ""},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_rejects_spaces_only_token(self):
        response = self.client.post(
            self.url,
            {"refresh": "   "},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_rejects_invalid_token(self):
        response = self.client.post(
            self.url,
            {"refresh": "not-a-valid-token"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rejects_access_token(self):
        access_token = str(RefreshToken.for_user(self.user).access_token)
        response = self.client.post(
            self.url,
            {"refresh": access_token},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rejects_malformed_token(self):
        response = self.client.post(
            self.url,
            {"refresh": "abc.def"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rejects_tampered_token(self):
        token_parts = self.refresh_token.split(".")
        token_parts[-1] = "tampered-signature"
        response = self.client.post(
            self.url,
            {"refresh": ".".join(token_parts)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rejects_expired_token(self):
        expired_token = RefreshToken.for_user(self.user)
        expired_token["exp"] = 1

        response = self.client.post(
            self.url,
            {"refresh": str(expired_token)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rejects_inactive_user(self):
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])

        response = self.client.post(
            self.url,
            {"refresh": self.refresh_token},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_refresh_rejects_deleted_user(self):
        self.user.delete()

        response = self.client.post(
            self.url,
            {"refresh": self.refresh_token},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rejects_inactive_role(self):
        self.role.is_active = False
        self.role.save(update_fields=["is_active"])

        response = self.client.post(
            self.url,
            {"refresh": self.refresh_token},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_refresh_rejects_blacklisted_token(self):
        token = RefreshToken(self.refresh_token)
        token.blacklist()

        response = self.client.post(
            self.url,
            {"refresh": self.refresh_token},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rotates_and_invalidates_old_token(self):
        first_response = self.client.post(
            self.url,
            {"refresh": self.refresh_token},
            format="json",
        )

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertIn("refresh", first_response.data["data"])

        second_response = self.client.post(
            self.url,
            {"refresh": self.refresh_token},
            format="json",
        )

        self.assertEqual(second_response.status_code, status.HTTP_401_UNAUTHORIZED)
