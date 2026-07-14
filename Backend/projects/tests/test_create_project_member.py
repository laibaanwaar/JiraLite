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
from projects.services.project_member_service import ProjectMemberService


User = get_user_model()


class CreateProjectMemberApiTests(APITestCase):
    """Tests for POST /api/projects/{project_id}/members/"""

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
        self.project_manager_user = cast(Any, User.objects).create_user(
            email="project-manager@example.com",
            password="ProjectPass123!",
            first_name="Project",
            last_name="Manager",
            role=self.project_manager_role,
            is_active=True,
        )
        self.task_manager_user = cast(Any, User.objects).create_user(
            email="task-manager@example.com",
            password="TaskPass123!",
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
        self.inactive_request_user = cast(Any, User.objects).create_user(
            email="inactive-request@example.com",
            password="InactivePass123!",
            first_name="Inactive",
            last_name="Requester",
            role=self.admin_role,
            is_active=False,
        )
        self.project_owner = cast(Any, User.objects).create_user(
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
            description="Project description",
            owner=self.project_owner,
        )
        self.url = reverse(
            "project-member-create",
            kwargs={"project_id": self.project.id},
        )

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def _payload(self, **overrides):
        base = {"user_id": self.engineer_user.id}
        base.update(overrides)
        return base

    def test_create_project_member_success(self):
        self._auth()
        response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["project"]["id"], self.project.id)
        self.assertEqual(response.data["data"]["project"]["owner"]["email"], self.project_owner.email)
        self.assertEqual(response.data["data"]["user"]["id"], self.engineer_user.id)
        self.assertEqual(response.data["data"]["user"]["email"], self.engineer_user.email)
        self.assertTrue(
            ProjectMember.objects.filter(project=self.project, user=self.engineer_user).exists()
        )

    def test_create_project_member_project_manager_allowed(self):
        self._auth(self.project_manager_user)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_project_member_task_manager_allowed(self):
        self._auth(self.task_manager_user)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_project_member_missing_jwt_rejected(self):
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_project_member_invalid_jwt_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_project_member_expired_jwt_rejected(self):
        token = RefreshToken.for_user(self.admin_user).access_token
        token["exp"] = 1
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_project_member_forbidden_for_engineer(self):
        self._auth(self.engineer_user)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_project_member_inactive_request_user_rejected(self):
        self._auth(self.inactive_request_user)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_project_member_invalid_project_id_rejected(self):
        self._auth()
        response = self.client.post("/api/projects/abc/members/", self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_member_negative_project_id_rejected(self):
        self._auth()
        response = self.client.post("/api/projects/-1/members/", self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_member_project_not_found(self):
        self._auth()
        response = self.client.post("/api/projects/99999/members/", self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_project_member_archived_project_rejected(self):
        self.project.is_archived = True
        self.project.save(update_fields=["is_archived", "updated_at"])

        self._auth()
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_member_missing_user_id_rejected(self):
        self._auth()
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_member_invalid_field_rejected(self):
        self._auth()
        response = self.client.post(
            self.url,
            {"user_id": self.engineer_user.id, "invalid_field": "value"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_member_invalid_json_body_rejected(self):
        self._auth()
        response = self.client.post(
            self.url,
            "not json",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_member_invalid_user_id_rejected(self):
        self._auth()
        response = self.client.post(self.url, self._payload(user_id=-1), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_member_user_not_found(self):
        self._auth()
        response = self.client.post(self.url, self._payload(user_id=99999), format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_project_member_inactive_user_rejected(self):
        self._auth()
        response = self.client.post(self.url, self._payload(user_id=self.inactive_user.id), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_member_duplicate_assignment_rejected(self):
        ProjectMember.objects.create(project=self.project, user=self.engineer_user)

        self._auth()
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_create_project_member_service_database_error_returns_500(self):
        with patch.object(ProjectMember.objects, "create", side_effect=DatabaseError("boom")):
            result = ProjectMemberService.create_project_member(
                project_id=self.project.id,
                user_id=self.engineer_user.id,
            )

        self.assertFalse(result["success"])
        self.assertEqual(result["code"], "server_error")

    def test_create_project_member_view_service_failure_returns_500(self):
        self._auth()
        with patch(
            "projects.views.create_project_member_view.ProjectMemberService.create_project_member",
            return_value={
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            },
        ):
            response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
