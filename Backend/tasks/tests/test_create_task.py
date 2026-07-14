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
from tasks.models.task import Task
from tasks.services.task_service import TaskService


User = get_user_model()


class CreateTaskApiTests(APITestCase):
    """Tests for POST /api/tasks/"""

    def setUp(self):
        self.admin_role = Role.objects.create(
            name="Admin",
            code="admin",
            description="Administrator role",
            is_active=True,
        )
        self.project_manager_role = Role.objects.create(
            name="Project Manager",
            code="project_manager",
            description="Project manager role",
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
        self.other_admin_user = cast(Any, User.objects).create_user(
            email="other-admin@example.com",
            password="AdminPass123!",
            first_name="Other",
            last_name="Admin",
            role=self.admin_role,
            is_active=True,
        )
        self.project_manager_user = cast(Any, User.objects).create_user(
            email="pm@example.com",
            password="ProjectPass123!",
            first_name="Project",
            last_name="Manager",
            role=self.project_manager_role,
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
        self.other_engineer_user = cast(Any, User.objects).create_user(
            email="other-engineer@example.com",
            password="EngineerPass123!",
            first_name="Other",
            last_name="Engineer",
            role=self.engineer_role,
            is_active=True,
        )
        self.inactive_admin_user = cast(Any, User.objects).create_user(
            email="inactive-admin@example.com",
            password="AdminPass123!",
            first_name="Inactive",
            last_name="Admin",
            role=self.admin_role,
            is_active=False,
        )
        self.inactive_engineer_user = cast(Any, User.objects).create_user(
            email="inactive-engineer@example.com",
            password="EngineerPass123!",
            first_name="Inactive",
            last_name="Engineer",
            role=self.engineer_role,
            is_active=False,
        )
        self.project = Project.objects.create(
            name="Alpha Project",
            key="ALPHA",
            description="Project description",
            owner=self.admin_user,
        )
        self.other_project = Project.objects.create(
            name="Beta Project",
            key="BETA",
            description="Beta description",
            owner=self.other_admin_user,
        )
        ProjectMember.objects.create(project=self.project, user=self.engineer_user)
        self.url = reverse("task-create")

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def _payload(self, **overrides):
        base = {
            "title": "Implement login API",
            "description": "Build the login endpoint",
            "project_id": self.project.id,
            "assigned_to_id": self.engineer_user.id,
        }
        base.update(overrides)
        return base

    def test_create_task_success(self):
        self._auth()
        response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["title"], "Implement login API")
        self.assertEqual(response.data["data"]["project"]["id"], self.project.id)
        self.assertEqual(response.data["data"]["assigned_to"]["email"], self.engineer_user.email)
        self.assertEqual(response.data["data"]["created_by"]["email"], self.admin_user.email)

    def test_create_task_defaults_description_blank(self):
        self._auth()
        payload = self._payload()
        del payload["description"]
        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["description"], "")

    def test_create_task_missing_jwt_rejected(self):
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_task_invalid_jwt_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_task_expired_jwt_rejected(self):
        token = RefreshToken.for_user(self.admin_user).access_token
        token["exp"] = 1
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_task_non_admin_rejected(self):
        self._auth(self.engineer_user)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_task_project_manager_rejected(self):
        self._auth(self.project_manager_user)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_task_inactive_admin_rejected(self):
        self._auth(self.inactive_admin_user)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_task_non_owner_admin_rejected(self):
        self._auth(self.other_admin_user)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_task_missing_title_rejected(self):
        self._auth()
        payload = self._payload()
        del payload["title"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_missing_project_id_rejected(self):
        self._auth()
        payload = self._payload()
        del payload["project_id"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_missing_assigned_to_id_rejected(self):
        self._auth()
        payload = self._payload()
        del payload["assigned_to_id"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_empty_request_rejected(self):
        self._auth()
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_invalid_field_rejected(self):
        self._auth()
        response = self.client.post(
            self.url,
            {**self._payload(), "invalid_field": "value"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_invalid_json_body_rejected(self):
        self._auth()
        response = self.client.post(
            self.url,
            "not json",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_invalid_project_id_rejected(self):
        self._auth()
        response = self.client.post(self.url, self._payload(project_id=-1), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_invalid_assigned_user_id_rejected(self):
        self._auth()
        response = self.client.post(self.url, self._payload(assigned_to_id=-1), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_project_not_found(self):
        self._auth()
        response = self.client.post(self.url, self._payload(project_id=99999), format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_task_assigned_user_not_found(self):
        self._auth()
        response = self.client.post(self.url, self._payload(assigned_to_id=99999), format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_task_archived_project_rejected(self):
        self.project.is_archived = True
        self.project.save(update_fields=["is_archived", "updated_at"])

        self._auth()
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_inactive_assigned_user_rejected(self):
        ProjectMember.objects.create(project=self.project, user=self.inactive_engineer_user)

        self._auth()
        response = self.client.post(
            self.url,
            self._payload(assigned_to_id=self.inactive_engineer_user.id),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_user_not_in_project_rejected(self):
        self._auth()
        response = self.client.post(
            self.url,
            self._payload(assigned_to_id=self.other_engineer_user.id),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_duplicate_title_rejected(self):
        self._auth()
        self.client.post(self.url, self._payload(), format="json")
        response = self.client.post(
            self.url,
            self._payload(description="Second attempt"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_create_task_view_service_failure_returns_500(self):
        self._auth()
        with patch(
            "tasks.views.create_task_view.TaskService.create_task",
            return_value={
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            },
        ):
            response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_create_task_service_database_error_returns_500(self):
        with patch.object(Task.objects, "create", side_effect=DatabaseError("boom")):
            result = TaskService.create_task(
                title="Implement dashboard",
                description="Build dashboard",
                project_id=self.project.id,
                assigned_to_id=self.engineer_user.id,
                created_by_id=self.admin_user.id,
            )

        self.assertFalse(result["success"])
        self.assertEqual(result["code"], "server_error")
