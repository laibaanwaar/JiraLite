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


class TaskUpdateApiTests(APITestCase):
    """Tests for PATCH /api/tasks/{id}/"""

    def setUp(self):
        self.admin_role = Role.objects.create(name="Admin", code="admin", description="Administrator role", is_active=True)
        self.project_manager_role = Role.objects.create(name="Project Manager", code="project_manager", description="Project manager role", is_active=True)
        self.engineer_role = Role.objects.create(name="Engineer", code="engineer", description="Engineer role", is_active=True)
        self.admin_user = cast(Any, User.objects).create_user(email="admin@example.com", password="AdminPass123!", first_name="Admin", last_name="User", role=self.admin_role, is_active=True)
        self.other_admin_user = cast(Any, User.objects).create_user(email="other-admin@example.com", password="AdminPass123!", first_name="Other", last_name="Admin", role=self.admin_role, is_active=True)
        self.project_manager_user = cast(Any, User.objects).create_user(email="pm@example.com", password="ProjectPass123!", first_name="Project", last_name="Manager", role=self.project_manager_role, is_active=True)
        self.engineer_user = cast(Any, User.objects).create_user(email="engineer@example.com", password="EngineerPass123!", first_name="Engineer", last_name="User", role=self.engineer_role, is_active=True)
        self.other_engineer_user = cast(Any, User.objects).create_user(email="other-engineer@example.com", password="EngineerPass123!", first_name="Other", last_name="Engineer", role=self.engineer_role, is_active=True)
        self.inactive_admin_user = cast(Any, User.objects).create_user(email="inactive-admin@example.com", password="AdminPass123!", first_name="Inactive", last_name="Admin", role=self.admin_role, is_active=False)
        self.inactive_engineer_user = cast(Any, User.objects).create_user(email="inactive-engineer@example.com", password="EngineerPass123!", first_name="Inactive", last_name="Engineer", role=self.engineer_role, is_active=False)
        self.project = Project.objects.create(name="Alpha Project", key="ALPHA", description="Project description", owner=self.admin_user)
        ProjectMember.objects.create(project=self.project, user=self.engineer_user)
        ProjectMember.objects.create(project=self.project, user=self.other_engineer_user)
        self.task = Task.objects.create(title="Implement login API", description="Build login", priority=Task.PRIORITY_MEDIUM, status=Task.STATUS_TODO, project=self.project, assigned_to=self.engineer_user, created_by=self.admin_user)
        self.url = reverse("task-update", kwargs={"task_id": self.task.id})

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def test_patch_task_success(self):
        self._auth()
        response = self.client.patch(self.url, {"title": "Updated Task", "priority": Task.PRIORITY_HIGH, "status": Task.STATUS_DONE, "due_date": "2026-12-31", "assigned_to_id": self.other_engineer_user.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["title"], "Updated Task")
        self.assertEqual(response.data["data"]["project_id"], self.project.id)
        self.assertEqual(response.data["data"]["assigned_to_id"], self.other_engineer_user.id)
        self.assertEqual(response.data["data"]["priority"], Task.PRIORITY_HIGH)
        self.assertEqual(response.data["data"]["status"], Task.STATUS_DONE)
        self.assertEqual(response.data["data"]["assigned_to"]["email"], self.other_engineer_user.email)
        self.assertEqual(response.data["data"]["due_date"], "2026-12-31")

    def test_patch_task_partial_update_keeps_due_date_when_not_provided(self):
        self.task.due_date = self.task.due_date or None
        self.task.save(update_fields=["due_date", "updated_at"])
        self._auth()
        response = self.client.patch(self.url, {"description": "Only description changed"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["description"], "Only description changed")
        self.assertEqual(response.data["data"]["title"], "Implement login API")

    def test_patch_task_missing_jwt_rejected(self):
        response = self.client.patch(self.url, {"title": "Blocked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_task_invalid_jwt_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.patch(self.url, {"title": "Blocked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_task_expired_jwt_rejected(self):
        token = RefreshToken.for_user(self.admin_user).access_token
        token["exp"] = 1
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")
        response = self.client.patch(self.url, {"title": "Blocked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_task_non_admin_rejected(self):
        self._auth(self.engineer_user)
        response = self.client.patch(self.url, {"title": "Blocked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_task_project_manager_rejected(self):
        self._auth(self.project_manager_user)
        response = self.client.patch(self.url, {"title": "Blocked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_task_inactive_admin_rejected(self):
        self._auth(self.inactive_admin_user)
        response = self.client.patch(self.url, {"title": "Blocked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_task_non_owner_admin_rejected(self):
        self._auth(self.other_admin_user)
        response = self.client.patch(self.url, {"title": "Blocked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_task_invalid_task_id_rejected(self):
        self._auth()
        response = self.client.patch("/api/tasks/abc/", {"title": "Blocked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_task_not_found(self):
        self._auth()
        response = self.client.patch("/api/tasks/99999/", {"title": "Blocked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_task_empty_request_rejected(self):
        self._auth()
        response = self.client.patch(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_task_invalid_field_rejected(self):
        self._auth()
        response = self.client.patch(self.url, {"unknown": "value"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_task_duplicate_title_rejected(self):
        Task.objects.create(title="Existing Task", description="", project=self.project, assigned_to=self.engineer_user, created_by=self.admin_user)
        self._auth()
        response = self.client.patch(self.url, {"title": "Existing Task"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_patch_task_assigned_user_not_found(self):
        self._auth()
        response = self.client.patch(self.url, {"assigned_to_id": 99999}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_task_inactive_assigned_user_rejected(self):
        ProjectMember.objects.create(project=self.project, user=self.inactive_engineer_user)
        self._auth()
        response = self.client.patch(self.url, {"assigned_to_id": self.inactive_engineer_user.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_task_user_not_in_project_rejected(self):
        outsider = cast(Any, User.objects).create_user(email="outsider@example.com", password="EngineerPass123!", first_name="Out", last_name="Sider", role=self.engineer_role, is_active=True)
        self._auth()
        response = self.client.patch(self.url, {"assigned_to_id": outsider.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_task_inactive_project_rejected(self):
        self.project.is_archived = True
        self.project.save(update_fields=["is_archived", "updated_at"])
        self._auth()
        response = self.client.patch(self.url, {"title": "Blocked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_task_view_service_failure_returns_500(self):
        self._auth()
        with patch("tasks.views.update_task_view.TaskService.update_task", return_value={"success": False, "code": "server_error", "message": "A server error occurred. Please try again later."}):
            response = self.client.patch(self.url, {"title": "Blocked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_patch_task_service_database_error_returns_500(self):
        with patch.object(Task.objects, "select_related", side_effect=DatabaseError("boom")):
            result = TaskService.update_task(task_id=self.task.id, requester_id=self.admin_user.id, title="Changed")
        self.assertFalse(result["success"])
        self.assertEqual(result["code"], "server_error")
