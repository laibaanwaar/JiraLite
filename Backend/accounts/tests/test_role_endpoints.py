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


class RoleListApiTests(APITestCase):
    """Tests for GET /api/roles/"""

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
        self.task_manager_role = Role.objects.create(
            name="Task Manager",
            code="task_manager",
            description="Task manager role",
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
        cast(Any, User.objects).create_user(
            email="engineer1@example.com",
            password="Pass12345!",
            first_name="Engineer",
            last_name="One",
            role=self.engineer_role,
            is_active=True,
        )
        cast(Any, User.objects).create_user(
            email="engineer2@example.com",
            password="Pass12345!",
            first_name="Engineer",
            last_name="Two",
            role=self.engineer_role,
            is_active=False,
        )
        self.url = reverse("role-list")

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def test_list_roles_success(self):
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("data", response.data)
        self.assertEqual(len(response.data["data"]), 3)
        self.assertEqual(response.data["data"][0]["name"], "Admin")

    def test_list_roles_includes_users_count(self):
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        engineer = next(item for item in response.data["data"] if item["code"] == "engineer")
        self.assertEqual(engineer["users_count"], 2)

    def test_list_roles_unauthenticated_rejected(self):
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_roles_non_admin_rejected(self):
        engineer_user = cast(Any, User.objects).create_user(
            email="viewer@example.com",
            password="ViewerPass123!",
            first_name="Viewer",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self._auth(engineer_user)
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_roles_inactive_admin_rejected(self):
        self.admin_user.is_active = False
        self.admin_user.save(update_fields=["is_active"])
        self._auth()
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_roles_invalid_token_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_roles_expired_token_rejected(self):
        token = RefreshToken.for_user(self.admin_user).access_token
        token["exp"] = 1
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_roles_service_database_error_returns_500(self):
        with patch.object(Role.objects, "annotate", side_effect=DatabaseError("boom")):
            result = RoleService.get_all_roles()

        self.assertFalse(result["success"])
        self.assertEqual(result["code"], "server_error")

    def test_list_roles_view_service_failure_returns_500(self):
        self._auth()
        with patch(
            "accounts.views.role_list_view.RoleService.get_all_roles",
            return_value={
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            },
        ):
            response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class RoleDetailApiTests(APITestCase):
    """Tests for GET /api/roles/{id}/"""

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
        cast(Any, User.objects).create_user(
            email="engineer@example.com",
            password="Pass12345!",
            first_name="Engineer",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self.url = reverse("role-detail", kwargs={"role_id": self.engineer_role.id})

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def test_get_role_detail_success(self):
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["id"], self.engineer_role.id)
        self.assertEqual(response.data["data"]["code"], "engineer")
        self.assertIn("users_count", response.data["data"])

    def test_get_role_detail_includes_reverse_user_count(self):
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["users_count"], 1)

    def test_get_role_detail_invalid_id_string(self):
        self._auth()
        response = self.client.get(reverse("role-detail", kwargs={"role_id": "invalid"}), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_role_detail_zero_id(self):
        self._auth()
        response = self.client.get(reverse("role-detail", kwargs={"role_id": 0}), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_role_detail_negative_id(self):
        self._auth()
        response = self.client.get(reverse("role-detail", kwargs={"role_id": -1}), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_role_detail_not_found(self):
        self._auth()
        response = self.client.get(reverse("role-detail", kwargs={"role_id": 9999}), format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_role_detail_unauthenticated_rejected(self):
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_role_detail_non_admin_rejected(self):
        non_admin = cast(Any, User.objects).create_user(
            email="user@example.com",
            password="UserPass123!",
            first_name="Normal",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self._auth(non_admin)
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_role_detail_inactive_admin_rejected(self):
        self.admin_user.is_active = False
        self.admin_user.save(update_fields=["is_active"])
        self._auth()
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_role_detail_invalid_token_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_role_detail_expired_token_rejected(self):
        token = RefreshToken.for_user(self.admin_user).access_token
        token["exp"] = 1
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_role_detail_service_database_error_returns_500(self):
        with patch.object(Role.objects, "annotate", side_effect=DatabaseError("boom")):
            result = RoleService.get_role_by_id(self.engineer_role.id)

        self.assertFalse(result["success"])
        self.assertEqual(result["code"], "server_error")

    def test_get_role_detail_view_service_failure_returns_500(self):
        self._auth()
        with patch(
            "accounts.views.role_detail_view.RoleService.get_role_by_id",
            return_value={
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            },
        ):
            response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class RoleCreateApiTests(APITestCase):
    """Tests for POST /api/roles/"""

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
        self.url = reverse("role-list")

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def _payload(self, **overrides):
        base = {
            "name": "Task Manager",
            "code": "task_manager",
            "description": "Manages tasks",
            "is_active": True,
        }
        base.update(overrides)
        return base

    def test_create_role_success(self):
        self._auth()
        response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["name"], "Task Manager")
        self.assertEqual(response.data["data"]["code"], "task_manager")
        self.assertEqual(response.data["data"]["users_count"], 0)

    def test_create_role_defaults_is_active_true(self):
        self._auth()
        payload = self._payload()
        del payload["is_active"]
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["data"]["is_active"])

    def test_create_role_trim_and_lowercase_code(self):
        self._auth()
        response = self.client.post(
            self.url,
            self._payload(name="  Support  ", code="  SUPPORT  "),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["name"], "Support")
        self.assertEqual(response.data["data"]["code"], "support")

    def test_create_role_unauthenticated_rejected(self):
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_role_non_admin_rejected(self):
        engineer_user = cast(Any, User.objects).create_user(
            email="user@example.com",
            password="UserPass123!",
            first_name="Normal",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self._auth(engineer_user)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_role_inactive_admin_rejected(self):
        self.admin_user.is_active = False
        self.admin_user.save(update_fields=["is_active"])
        self._auth()
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_role_invalid_token_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_role_expired_token_rejected(self):
        token = RefreshToken.for_user(self.admin_user).access_token
        token["exp"] = 1
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_role_missing_name_rejected(self):
        self._auth()
        payload = self._payload()
        del payload["name"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_role_missing_code_rejected(self):
        self._auth()
        payload = self._payload()
        del payload["code"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_role_empty_request_rejected(self):
        self._auth()
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_role_invalid_field_rejected(self):
        self._auth()
        response = self.client.post(
            self.url,
            {**self._payload(), "invalid_field": "value"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_role_duplicate_name_rejected(self):
        self._auth()
        self.client.post(self.url, self._payload(), format="json")
        response = self.client.post(
            self.url,
            self._payload(code="other_code"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_create_role_duplicate_code_rejected(self):
        self._auth()
        self.client.post(self.url, self._payload(), format="json")
        response = self.client.post(
            self.url,
            self._payload(name="Other Role"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_create_role_service_failure_returns_500(self):
        self._auth()
        with patch(
            "accounts.views.create_role_view.RoleService.create_role",
            return_value={
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            },
        ):
            response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_create_role_service_database_error_returns_500(self):
        with patch.object(Role.objects, "create", side_effect=DatabaseError("boom")):
            result = RoleService.create_role(
                name="Operations",
                code="operations",
                description="Operations role",
                is_active=True,
            )

        self.assertFalse(result["success"])
        self.assertEqual(result["code"], "server_error")


class RoleUpdateApiTests(APITestCase):
    """Tests for PATCH /api/roles/{id}/"""

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
        self.task_manager_role = Role.objects.create(
            name="Task Manager",
            code="task_manager",
            description="Task manager role",
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
        self.url = reverse("role-detail", kwargs={"role_id": self.engineer_role.id})

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def _payload(self, **overrides):
        base = {
            "name": "Updated Engineer",
            "code": "updated_engineer",
            "description": "Updated description",
            "is_active": True,
        }
        base.update(overrides)
        return base

    def test_update_role_success(self):
        self._auth()
        response = self.client.patch(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["name"], "Updated Engineer")
        self.assertEqual(response.data["data"]["code"], "updated_engineer")

    def test_update_role_partial_name_only(self):
        self._auth()
        response = self.client.patch(self.url, {"name": "Partial Name"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["name"], "Partial Name")

    def test_update_role_to_inactive(self):
        self._auth()
        response = self.client.patch(self.url, {"is_active": False}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["data"]["is_active"])

    def test_update_inactive_role_success(self):
        self._auth()
        response = self.client.patch(
            reverse("role-detail", kwargs={"role_id": self.task_manager_role.id}),
            {"description": "Now active role", "is_active": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["data"]["is_active"])

    def test_update_role_unauthenticated_rejected(self):
        response = self.client.patch(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_role_non_admin_rejected(self):
        non_admin = cast(Any, User.objects).create_user(
            email="user@example.com",
            password="UserPass123!",
            first_name="Normal",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self._auth(non_admin)
        response = self.client.patch(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_role_inactive_admin_rejected(self):
        self.admin_user.is_active = False
        self.admin_user.save(update_fields=["is_active"])
        self._auth()
        response = self.client.patch(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_role_invalid_token_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.patch(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_role_expired_token_rejected(self):
        token = RefreshToken.for_user(self.admin_user).access_token
        token["exp"] = 1
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")
        response = self.client.patch(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_role_invalid_id_string(self):
        self._auth()
        response = self.client.patch(
            reverse("role-detail", kwargs={"role_id": "invalid"}),
            self._payload(),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_role_zero_id(self):
        self._auth()
        response = self.client.patch(
            reverse("role-detail", kwargs={"role_id": 0}),
            self._payload(),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_role_negative_id(self):
        self._auth()
        response = self.client.patch(
            reverse("role-detail", kwargs={"role_id": -1}),
            self._payload(),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_role_not_found(self):
        self._auth()
        response = self.client.patch(
            reverse("role-detail", kwargs={"role_id": 9999}),
            self._payload(),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_role_empty_request_rejected(self):
        self._auth()
        response = self.client.patch(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_role_invalid_field_rejected(self):
        self._auth()
        response = self.client.patch(self.url, {"invalid_field": "value"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_role_duplicate_name_rejected(self):
        Role.objects.create(
            name="Support",
            code="support",
            description="Support role",
            is_active=True,
        )
        self._auth()
        response = self.client.patch(self.url, {"name": "Support"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_update_role_duplicate_code_rejected(self):
        Role.objects.create(
            name="Support",
            code="support",
            description="Support role",
            is_active=True,
        )
        self._auth()
        response = self.client.patch(self.url, {"code": "support"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_update_admin_role_protected_from_code_change(self):
        self._auth()
        response = self.client.patch(
            reverse("role-detail", kwargs={"role_id": self.admin_role.id}),
            {"code": "super_admin"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_admin_role_protected_from_deactivation(self):
        self._auth()
        response = self.client.patch(
            reverse("role-detail", kwargs={"role_id": self.admin_role.id}),
            {"is_active": False},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_role_view_service_failure_returns_500(self):
        self._auth()
        with patch(
            "accounts.views.update_role_view.RoleService.update_role",
            return_value={
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            },
        ):
            response = self.client.patch(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_update_role_service_database_error_returns_500(self):
        self._auth()
        with patch.object(Role.objects, "select_for_update", side_effect=DatabaseError("boom")):
            result = RoleService.update_role(
                role_id=self.engineer_role.id,
                name="Updated Engineer",
            )

        self.assertFalse(result["success"])
        self.assertEqual(result["code"], "server_error")


class RoleDeactivateApiTests(APITestCase):
    """Tests for PATCH /api/roles/{id}/deactivate/"""

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
        self.linked_user = cast(Any, User.objects).create_user(
            email="linked@example.com",
            password="LinkedPass123!",
            first_name="Linked",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self.url = reverse("role-deactivate", kwargs={"role_id": self.engineer_role.id})

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def test_deactivate_role_success(self):
        self._auth()
        response = self.client.patch(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["data"]["is_active"])
        self.engineer_role.refresh_from_db()
        self.assertFalse(self.engineer_role.is_active)
        self.linked_user.refresh_from_db()
        self.assertEqual(self.linked_user.role_id, self.engineer_role.id)

    def test_deactivate_role_prevents_new_user_assignment(self):
        self._auth()
        self.client.patch(self.url, format="json")

        response = self.client.post(
            reverse("user-list"),
            {
                "first_name": "New",
                "last_name": "User",
                "email": "new@example.com",
                "password": "SecurePass1!",
                "role_id": self.engineer_role.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deactivate_role_unauthenticated_rejected(self):
        response = self.client.patch(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_deactivate_role_non_admin_rejected(self):
        non_admin = cast(Any, User.objects).create_user(
            email="user@example.com",
            password="UserPass123!",
            first_name="Normal",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self._auth(non_admin)
        response = self.client.patch(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_deactivate_role_inactive_admin_rejected(self):
        self.admin_user.is_active = False
        self.admin_user.save(update_fields=["is_active"])
        self._auth()
        response = self.client.patch(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_deactivate_role_invalid_token_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.patch(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_deactivate_role_expired_token_rejected(self):
        token = RefreshToken.for_user(self.admin_user).access_token
        token["exp"] = 1
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")
        response = self.client.patch(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_deactivate_role_invalid_id_string(self):
        self._auth()
        response = self.client.patch(
            reverse("role-deactivate", kwargs={"role_id": "invalid"}),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deactivate_role_zero_id(self):
        self._auth()
        response = self.client.patch(
            reverse("role-deactivate", kwargs={"role_id": 0}),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deactivate_role_negative_id(self):
        self._auth()
        response = self.client.patch(
            reverse("role-deactivate", kwargs={"role_id": -1}),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deactivate_role_not_found(self):
        self._auth()
        response = self.client.patch(
            reverse("role-deactivate", kwargs={"role_id": 9999}),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_deactivate_role_already_inactive(self):
        self._auth()
        response = self.client.patch(
            reverse("role-deactivate", kwargs={"role_id": self.inactive_role.id}),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deactivate_admin_role_rejected(self):
        self._auth()
        response = self.client.patch(
            reverse("role-deactivate", kwargs={"role_id": self.admin_role.id}),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_deactivate_role_view_service_failure_returns_500(self):
        self._auth()
        with patch(
            "accounts.views.deactivate_role_view.RoleService.deactivate_role",
            return_value={
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            },
        ):
            response = self.client.patch(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_deactivate_role_service_database_error_returns_500(self):
        self._auth()
        with patch.object(Role.objects, "select_for_update", side_effect=DatabaseError("boom")):
            result = RoleService.deactivate_role(role_id=self.engineer_role.id)

        self.assertFalse(result["success"])
        self.assertEqual(result["code"], "server_error")
