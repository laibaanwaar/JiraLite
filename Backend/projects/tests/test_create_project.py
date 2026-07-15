from typing import Any, cast
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import DatabaseError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models.role import Role
from projects.models.project import Project
from projects.models.project_member import ProjectMember
from projects.services.project_service import ProjectService


User = get_user_model()


class CreateProjectApiTests(APITestCase):
    """Tests for POST /api/projects/"""

    def setUp(self):
        self.admin_role = Role.objects.create(
            name="Admin",
            code="admin",
            description="Administrator role",
            is_active=True,
        )
        self.task_manager_role = Role.objects.create(
            name="Task Manager",
            code="task_manager",
            description="Task manager role",
            is_active=True,
        )
        self.engineer_role = Role.objects.create(
            name="Engineer",
            code="engineer",
            description="Engineer role",
            is_active=True,
        )
        self.inactive_role = Role.objects.create(
            name="Inactive Role",
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
        self.task_manager_user = cast(Any, User.objects).create_user(
            email="manager@example.com",
            password="ManagerPass123!",
            first_name="Task",
            last_name="Manager",
            role=self.task_manager_role,
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
        self.inactive_user = cast(Any, User.objects).create_user(
            email="inactive@example.com",
            password="InactivePass123!",
            first_name="Inactive",
            last_name="User",
            role=self.engineer_role,
            is_active=False,
        )
        self.url = reverse("project-create")

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def _payload(self, **overrides):
        base = {
            "name": "Alpha Project",
            "key": "ALPHA",
            "description": "Project description",
            "owner_id": self.engineer_user.id,
        }
        base.update(overrides)
        return base

    def test_create_project_success(self):
        self._auth()
        response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["name"], "Alpha Project")
        self.assertEqual(response.data["data"]["key"], "ALPHA")
        self.assertEqual(response.data["data"]["owner_id"], self.engineer_user.id)
        self.assertTrue(
            ProjectMember.objects.filter(
                project_id=response.data["data"]["id"],
                user_id=self.engineer_user.id,
            ).exists()
        )

    def test_create_project_defaults_description_blank(self):
        self._auth()
        payload = self._payload()
        del payload["description"]
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["description"], "")

    def test_create_project_unauthenticated_rejected(self):
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_project_non_admin_rejected(self):
        self._auth(self.engineer_user)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_project_task_manager_allowed(self):
        self._auth(self.task_manager_user)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_project_inactive_user_rejected(self):
        self._auth(self.inactive_user)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_project_invalid_token_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_project_expired_token_rejected(self):
        token = RefreshToken.for_user(self.admin_user).access_token
        token["exp"] = 1
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_project_missing_name_rejected(self):
        self._auth()
        payload = self._payload()
        del payload["name"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_missing_key_rejected(self):
        self._auth()
        payload = self._payload()
        del payload["key"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_empty_request_rejected(self):
        self._auth()
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_invalid_field_rejected(self):
        self._auth()
        response = self.client.post(
            self.url,
            {**self._payload(), "invalid_field": "value"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_invalid_json_body_rejected(self):
        self._auth()
        response = self.client.post(
            self.url,
            "not json",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_invalid_owner_id_rejected(self):
        self._auth()
        response = self.client.post(self.url, self._payload(owner_id=-1), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_owner_not_found(self):
        self._auth()
        response = self.client.post(self.url, self._payload(owner_id=9999), format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_project_owner_inactive_rejected(self):
        self._auth()
        response = self.client.post(self.url, self._payload(owner_id=self.inactive_user.id), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_duplicate_name_rejected(self):
        self._auth()
        self.client.post(self.url, self._payload(), format="json")
        response = self.client.post(
            self.url,
            self._payload(key="BETA"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_create_project_duplicate_key_rejected(self):
        self._auth()
        self.client.post(self.url, self._payload(), format="json")
        response = self.client.post(
            self.url,
            self._payload(name="Beta Project"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_create_project_view_service_failure_returns_500(self):
        self._auth()
        with patch(
            "projects.views.create_project_view.ProjectService.create_project",
            return_value={
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            },
        ):
            response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_create_project_service_database_error_returns_500(self):
        self._auth()
        with patch.object(Project.objects, "create", side_effect=DatabaseError("boom")):
            result = ProjectService.create_project(
                name="Gamma Project",
                key="GAMMA",
                description="Gamma",
                owner_id=self.engineer_user.id,
            )

        self.assertFalse(result["success"])
        self.assertEqual(result["code"], "server_error")
