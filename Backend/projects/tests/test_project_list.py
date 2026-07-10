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
from projects.services.project_service import ProjectService


User = get_user_model()


class ProjectListApiTests(APITestCase):
    """Tests for GET /api/projects/"""

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
        self.admin_user = cast(Any, User.objects).create_user(
            email="admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            last_name="User",
            role=self.admin_role,
            is_active=True,
        )
        self.manager_user = cast(Any, User.objects).create_user(
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
        self.other_user = cast(Any, User.objects).create_user(
            email="other@example.com",
            password="OtherPass123!",
            first_name="Other",
            last_name="User",
            role=self.engineer_role,
            is_active=False,
        )
        self.project_a = Project.objects.create(
            name="Alpha Project",
            key="ALPHA",
            description="Alpha description",
            owner=self.engineer_user,
        )
        self.project_b = Project.objects.create(
            name="Beta Project",
            key="BETA",
            description="Beta description",
            owner=self.manager_user,
        )
        self.url = reverse("project-list")

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def test_list_projects_success(self):
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("data", response.data)
        self.assertIn("pagination", response.data)
        self.assertEqual(response.data["pagination"]["total_count"], 2)
        self.assertEqual(len(response.data["data"]), 2)
        self.assertIn("owner", response.data["data"][0])

    def test_list_projects_includes_owner_details(self):
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        project = response.data["data"][0]
        self.assertIn("owner_id", project)
        self.assertIn("owner", project)
        self.assertIn("email", project["owner"])
        self.assertIn("role", project["owner"])

    def test_list_projects_search_by_name(self):
        self._auth()
        response = self.client.get(f"{self.url}?search=Alpha", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["name"], "Alpha Project")

    def test_list_projects_search_by_owner_email(self):
        self._auth()
        response = self.client.get(f"{self.url}?search=manager@example.com", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["owner"]["email"], "manager@example.com")

    def test_list_projects_filter_by_owner_id(self):
        self._auth()
        response = self.client.get(
            f"{self.url}?filter=owner_id&filter_value={self.engineer_user.id}",
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)

    def test_list_projects_filter_by_owner_role_code(self):
        self._auth()
        response = self.client.get(
            f"{self.url}?filter=owner_role_code&filter_value=task_manager",
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["owner"]["role"]["code"], "task_manager")

    def test_list_projects_sort_by_key(self):
        self._auth()
        response = self.client.get(f"{self.url}?sort=key", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        keys = [item["key"] for item in response.data["data"]]
        self.assertEqual(keys, sorted(keys))

    def test_list_projects_custom_pagination(self):
        self._auth()
        response = self.client.get(f"{self.url}?limit=1&offset=1", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["pagination"]["limit"], 1)
        self.assertEqual(response.data["pagination"]["offset"], 1)
        self.assertEqual(len(response.data["data"]), 1)

    def test_list_projects_unauthenticated_rejected(self):
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_projects_non_admin_or_manager_rejected(self):
        self._auth(self.engineer_user)
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_projects_inactive_user_rejected(self):
        self._auth(self.other_user)
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_projects_invalid_token_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_projects_expired_token_rejected(self):
        token = RefreshToken.for_user(self.admin_user).access_token
        token["exp"] = 1
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_projects_invalid_limit_rejected(self):
        self._auth()
        response = self.client.get(f"{self.url}?limit=abc", format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_projects_invalid_offset_rejected(self):
        self._auth()
        response = self.client.get(f"{self.url}?offset=-1", format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_projects_invalid_sort_rejected(self):
        self._auth()
        response = self.client.get(f"{self.url}?sort=unknown", format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_projects_invalid_filter_rejected(self):
        self._auth()
        response = self.client.get(f"{self.url}?filter=unknown&filter_value=x", format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_projects_invalid_filter_value_rejected(self):
        self._auth()
        response = self.client.get(f"{self.url}?filter=owner_id&filter_value=abc", format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_projects_empty_result(self):
        self._auth()
        response = self.client.get(f"{self.url}?search=nonexistent", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 0)
        self.assertEqual(response.data["pagination"]["total_count"], 0)

    def test_list_projects_view_service_failure_returns_500(self):
        self._auth()
        with patch(
            "projects.views.list_project_view.ProjectService.get_all_projects",
            return_value={
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            },
        ):
            response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_list_projects_service_database_error_returns_500(self):
        self._auth()
        with patch.object(Project.objects, "select_related", side_effect=DatabaseError("boom")):
            result = ProjectService.get_all_projects()

        self.assertFalse(result["success"])
        self.assertEqual(result["code"], "server_error")
