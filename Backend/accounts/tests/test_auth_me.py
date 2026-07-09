from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APITestCase

from accounts.models.role import Role


User = get_user_model()


class MeApiTests(APITestCase):
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
        self.url = reverse("auth-me")
        self.access_token = str(RefreshToken.for_user(self.user).access_token)

    def test_me_requires_authentication(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_profile(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["email"], "john@example.com")
        self.assertEqual(response.data["data"]["role"], "Engineer")

    def test_me_rejects_inactive_user(self):
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_me_rejects_inactive_role(self):
        self.role.is_active = False
        self.role.save(update_fields=["is_active"])
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

