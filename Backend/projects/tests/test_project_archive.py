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


class ProjectArchiveApiTests(APITestCase):
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
        self.inactive_user = cast(Any, User.objects).create_user(
            email="inactive@example.com",
            password="InactivePass123!",
            first_name="Inactive",
            last_name="User",
            role=self.engineer_role,
            is_active=False,
        )
        self.owner = cast(Any, User.objects).create_user(
            email="owner@example.com",
            password="OwnerPass123!",
            first_name="Owner",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self.project = Project.objects.create(
            name="Alpha Project",
            key="ALPHA",
            description="Alpha description",
            owner=self.owner,
        )
        self.url = reverse("project-archive", kwargs={"project_id": self.project.id})

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def test_archive_project_success(self):
        self._auth()
        response = self.client.patch(self.url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["data"]["is_archived"])
        self.project.refresh_from_db()
        self.assertTrue(self.project.is_archived)

    def test_archive_project_unauthenticated_rejected(self):
        response = self.client.patch(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_archive_project_invalid_token_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.patch(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_archive_project_expired_token_rejected(self):
        token = RefreshToken.for_user(self.admin_user).access_token
        token["exp"] = 1
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")
        response = self.client.patch(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_archive_project_non_admin_rejected(self):
        self._auth(self.engineer_user)
        response = self.client.patch(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_archive_project_task_manager_allowed(self):
        self._auth(self.manager_user)
        response = self.client.patch(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_archive_project_inactive_user_rejected(self):
        self._auth(self.inactive_user)
        response = self.client.patch(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_archive_project_invalid_project_id_rejected(self):
        self._auth()
        response = self.client.patch("/api/projects/abc/archive/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_archive_project_negative_project_id_rejected(self):
        self._auth()
        response = self.client.patch("/api/projects/-1/archive/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_archive_project_not_found(self):
        self._auth()
        response = self.client.patch("/api/projects/99999/archive/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_archive_project_already_archived_rejected(self):
        self._auth()
        self.client.patch(self.url, {}, format="json")
        response = self.client.patch(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_archive_project_view_service_failure_returns_500(self):
        self._auth()
        with patch(
            "projects.views.archive_project_view.ProjectService.archive_project",
            return_value={
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            },
        ):
            response = self.client.patch(self.url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_archive_project_service_database_error_returns_500(self):
        self._auth()
        with patch.object(Project.objects, "select_for_update", side_effect=DatabaseError("boom")):
            result = ProjectService.archive_project(self.project.id)

        self.assertFalse(result["success"])
        self.assertEqual(result["code"], "server_error")
