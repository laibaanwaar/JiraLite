from typing import Any, cast
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import DatabaseError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models.role import Role
from accounts.services.role_service import RoleService


User = get_user_model()


class RoleDashboardApiTests(APITestCase):
    """Tests for GET /api/roles/dashboard/."""

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
        self.inactive_role = Role.objects.create(
            name="Inactive",
            code="inactive",
            description="Inactive role",
            is_active=False,
        )
        self.admin_user = cast(Any, User.objects).create_user(
            email="admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            last_name="User",
            role=self.admin_role,
            is_active=True,
        )
        self.engineer_user = cast(Any, User.objects).create_user(
            email="engineer@example.com",
            password="EngineerPass123!",
            first_name="Engineer",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self.url = reverse("role-dashboard")

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def test_get_role_dashboard_success(self):
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["data"],
            {
                "total_roles": 3,
                "active_roles": 2,
                "inactive_roles": 1,
            },
        )

    def test_get_role_dashboard_no_roles_defaults_to_zero(self):
        with patch.object(Role.objects, "count", return_value=0), patch.object(
            Role.objects,
            "filter",
        ) as mock_filter:
            mock_filter.side_effect = [
                type("QuerySetMock", (), {"count": lambda self: 0})(),
                type("QuerySetMock", (), {"count": lambda self: 0})(),
            ]

            result = RoleService.get_dashboard_stats()

        self.assertTrue(result["success"])
        self.assertEqual(
            result["data"],
            {
                "total_roles": 0,
                "active_roles": 0,
                "inactive_roles": 0,
            },
        )

    def test_get_role_dashboard_all_roles_active(self):
        self.inactive_role.is_active = True
        self.inactive_role.save(update_fields=["is_active", "updated_at"])

        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["total_roles"], 3)
        self.assertEqual(response.data["data"]["active_roles"], 3)
        self.assertEqual(response.data["data"]["inactive_roles"], 0)

    def test_get_role_dashboard_all_roles_inactive_including_admin_role_counted(self):
        self.admin_role.is_active = False
        self.admin_role.save(update_fields=["is_active", "updated_at"])
        self.engineer_role.is_active = False
        self.engineer_role.save(update_fields=["is_active", "updated_at"])

        with patch.object(
            RoleService,
            "get_dashboard_stats",
            wraps=RoleService.get_dashboard_stats,
        ) as wrapped:
            result = wrapped()

        self.assertTrue(result["success"])
        self.assertEqual(result["data"]["total_roles"], 3)
        self.assertEqual(result["data"]["active_roles"], 0)
        self.assertEqual(result["data"]["inactive_roles"], 3)

    def test_get_role_dashboard_unauthorized(self):
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["message"], "Unauthorized.")

    def test_get_role_dashboard_non_admin_forbidden(self):
        self._auth(self.engineer_user)
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "Permission denied.")

    def test_get_role_dashboard_inactive_admin_forbidden(self):
        self.admin_user.is_active = False
        self.admin_user.save(update_fields=["is_active"])
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "Permission denied.")

    def test_get_role_dashboard_service_error(self):
        self._auth()
        with patch(
            "accounts.views.role_dashboard_view.RoleService.get_dashboard_stats",
            return_value={
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            },
        ):
            response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data["message"], "A server error occurred. Please try again later.")

    def test_get_role_dashboard_database_error(self):
        with patch.object(Role.objects, "count", side_effect=DatabaseError("boom")):
            result = RoleService.get_dashboard_stats()

        self.assertFalse(result["success"])
        self.assertEqual(result["code"], "server_error")
