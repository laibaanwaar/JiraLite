from datetime import timedelta
from typing import Any, cast
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import DatabaseError
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models.role import Role
from accounts.services.user_service import UserService


User = get_user_model()


class UserDashboardApiTests(APITestCase):
    """Tests for GET /api/users/dashboard/."""

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
        self.active_user = cast(Any, User.objects).create_user(
            email="active@example.com",
            password="ActivePass123!",
            first_name="Active",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self.idle_user = cast(Any, User.objects).create_user(
            email="idle@example.com",
            password="IdlePass123!",
            first_name="Idle",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self.active_user.last_login = timezone.now() - timedelta(minutes=5)
        self.active_user.save(update_fields=["last_login"])
        self.idle_user.last_login = timezone.now() - timedelta(hours=2)
        self.idle_user.save(update_fields=["last_login"])
        self.url = reverse("user-dashboard")

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def test_get_user_dashboard_success(self):
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["total_users"], 3)
        self.assertEqual(response.data["data"]["active_now"], 1)
        self.assertEqual(response.data["data"]["open_invites"], 0)

    def test_get_user_dashboard_service_no_users_defaults_to_zero(self):
        with patch.object(User.objects, "count", return_value=0), patch.object(
            User.objects,
            "filter",
        ) as mock_filter:
            mock_filter.return_value.count.return_value = 0
            result = UserService.get_dashboard_stats()

        self.assertTrue(result["success"])
        self.assertEqual(
            result["data"],
            {
                "total_users": 0,
                "active_now": 0,
                "open_invites": 0,
            },
        )

    def test_get_user_dashboard_unauthorized(self):
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["message"], "Unauthorized.")

    def test_get_user_dashboard_non_admin_forbidden(self):
        self._auth(self.active_user)
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "Permission denied.")

    def test_get_user_dashboard_inactive_admin_forbidden(self):
        self.admin_user.is_active = False
        self.admin_user.save(update_fields=["is_active"])
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "Permission denied.")

    def test_get_user_dashboard_service_error(self):
        self._auth()
        with patch(
            "accounts.views.user_dashboard_view.UserService.get_dashboard_stats",
            return_value={
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            },
        ):
            response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data["message"], "A server error occurred. Please try again later.")

    def test_get_user_dashboard_database_error(self):
        with patch.object(User.objects, "count", side_effect=DatabaseError("boom")):
            result = UserService.get_dashboard_stats()

        self.assertFalse(result["success"])
        self.assertEqual(result["code"], "server_error")
