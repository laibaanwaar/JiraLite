from datetime import date, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import DatabaseError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken

from projects.models import Project, ProjectMember, Task


User = get_user_model()


class TaskApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            first_name="Owner",
            last_name="User",
            email="owner@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        self.admin = User.objects.create_user(
            first_name="Admin",
            last_name="User",
            email="admin@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        self.member = User.objects.create_user(
            first_name="Member",
            last_name="User",
            email="member@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        self.other = User.objects.create_user(
            first_name="Other",
            last_name="User",
            email="other@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )

        self.project = Project.objects.create(
            name="JiraLite",
            description="Backend work",
            created_by=self.owner,
        )
        self.other_project = Project.objects.create(
            name="Second Project",
            description="Other work",
            created_by=self.other,
        )

        self.owner_membership = ProjectMember.objects.create(
            project=self.project,
            user=self.owner,
            role=ProjectMember.ROLE_OWNER,
        )
        self.admin_membership = ProjectMember.objects.create(
            project=self.project,
            user=self.admin,
            role=ProjectMember.ROLE_ADMIN,
        )
        self.member_membership = ProjectMember.objects.create(
            project=self.project,
            user=self.member,
            role=ProjectMember.ROLE_MEMBER,
        )
        self.other_membership = ProjectMember.objects.create(
            project=self.other_project,
            user=self.other,
            role=ProjectMember.ROLE_OWNER,
        )

        self.task = Task.objects.create(
            project=self.project,
            title="Create Login API",
            description="Implement JWT login and logout functionality.",
            assignee=self.member_membership,
            created_by=self.owner,
            priority=Task.PRIORITY_HIGH,
            status=Task.STATUS_TO_DO,
            due_date=date.today() + timedelta(days=7),
        )
        self.other_task = Task.objects.create(
            project=self.other_project,
            title="Other Task",
            description="Other project task",
            assignee=self.other_membership,
            created_by=self.other,
            priority=Task.PRIORITY_LOW,
            status=Task.STATUS_DONE,
            due_date=date.today() + timedelta(days=5),
        )

        self.project_task_list_url = reverse("project-task-list", kwargs={"project_id": self.project.id})
        self.all_tasks_url = reverse("task-list")
        self.my_tasks_url = reverse("task-my-list")
        self.task_detail_url = reverse("task-detail", kwargs={"task_id": self.task.id})

        refresh = RefreshToken.for_user(self.owner)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def test_create_task_success_for_owner(self):
        response = self.client.post(
            self.project_task_list_url,
            {
                "title": "Create Signup API",
                "description": "Implement signup flow.",
                "assignee_id": self.admin_membership.id,
                "priority": Task.PRIORITY_URGENT,
                "status": Task.STATUS_IN_PROGRESS,
                "due_date": str(date.today() + timedelta(days=10)),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.filter(project=self.project).count(), 2)
        self.assertEqual(response.data["data"]["project"]["id"], self.project.id)
        self.assertEqual(response.data["data"]["assignee"]["project_member_id"], self.admin_membership.id)

    def test_create_task_success_for_admin(self):
        self.authenticate(self.admin)
        response = self.client.post(
            self.project_task_list_url,
            {
                "title": "Create Profile API",
                "description": "Implement profile api.",
                "assignee_id": self.member_membership.id,
                "priority": Task.PRIORITY_HIGH,
                "status": Task.STATUS_TO_DO,
                "due_date": str(date.today() + timedelta(days=2)),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_member_cannot_create_task(self):
        self.authenticate(self.member)
        response = self.client.post(
            self.project_task_list_url,
            {
                "title": "Not allowed",
                "description": "",
                "assignee_id": self.member_membership.id,
                "priority": Task.PRIORITY_LOW,
                "status": Task.STATUS_TO_DO,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_task_rejects_assignee_from_other_project(self):
        response = self.client.post(
            self.project_task_list_url,
            {
                "title": "Cross project assign",
                "description": "",
                "assignee_id": self.other_membership.id,
                "priority": Task.PRIORITY_LOW,
                "status": Task.STATUS_TO_DO,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_rejects_past_due_date(self):
        response = self.client.post(
            self.project_task_list_url,
            {
                "title": "Past task",
                "description": "",
                "assignee_id": self.member_membership.id,
                "priority": Task.PRIORITY_LOW,
                "status": Task.STATUS_TO_DO,
                "due_date": str(date.today() - timedelta(days=1)),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_project_task_list_requires_membership(self):
        self.authenticate(self.other)
        response = self.client.get(self.project_task_list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_project_task_list_supports_filters_and_search(self):
        Task.objects.create(
            project=self.project,
            title="Review login docs",
            description="Review API docs",
            assignee=self.admin_membership,
            created_by=self.owner,
            priority=Task.PRIORITY_MEDIUM,
            status=Task.STATUS_IN_PROGRESS,
            due_date=date.today() + timedelta(days=3),
        )

        response = self.client.get(
            f"{self.project_task_list_url}?status=IN_PROGRESS&search=review&ordering=-created_at"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 1)
        self.assertEqual(response.data["data"]["results"][0]["title"], "Review login docs")

    def test_all_tasks_only_returns_accessible_projects(self):
        response = self.client.get(self.all_tasks_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item["id"] for item in response.data["data"]["results"]}
        self.assertIn(self.task.id, returned_ids)
        self.assertNotIn(self.other_task.id, returned_ids)

    def test_my_tasks_only_returns_assigned_tasks(self):
        self.authenticate(self.member)
        response = self.client.get(self.my_tasks_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 1)
        self.assertEqual(response.data["data"]["results"][0]["id"], self.task.id)

    def test_task_detail_hides_inaccessible_task(self):
        self.authenticate(self.member)
        other_task_url = reverse("task-detail", kwargs={"task_id": self.other_task.id})
        response = self.client.get(other_task_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_can_update_all_allowed_fields(self):
        response = self.client.patch(
            self.task_detail_url,
            {
                "title": "Create Auth API",
                "assignee_id": self.admin_membership.id,
                "priority": Task.PRIORITY_URGENT,
                "status": Task.STATUS_IN_PROGRESS,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.title, "Create Auth API")
        self.assertEqual(self.task.assignee_id, self.admin_membership.id)

    def test_member_can_update_only_own_status(self):
        self.authenticate(self.member)
        response = self.client.patch(
            self.task_detail_url,
            {"status": Task.STATUS_IN_PROGRESS},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.STATUS_IN_PROGRESS)

    def test_member_cannot_update_own_title(self):
        self.authenticate(self.member)
        response = self.client.patch(
            self.task_detail_url,
            {"title": "Changed by member"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_cannot_update_another_users_task(self):
        admin_task = Task.objects.create(
            project=self.project,
            title="Admin task",
            description="Assigned elsewhere",
            assignee=self.admin_membership,
            created_by=self.owner,
            priority=Task.PRIORITY_LOW,
            status=Task.STATUS_TO_DO,
            due_date=date.today() + timedelta(days=4),
        )
        self.authenticate(self.member)
        response = self.client.patch(
            reverse("task-detail", kwargs={"task_id": admin_task.id}),
            {"status": Task.STATUS_DONE},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_rejects_restricted_fields(self):
        response = self.client.patch(
            self.task_detail_url,
            {"project_id": self.other_project.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_can_reassign_task(self):
        response = self.client.patch(
            self.task_detail_url,
            {"assignee_id": self.admin_membership.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.assignee_id, self.admin_membership.id)

    def test_delete_task_soft_deletes(self):
        response = self.client.delete(self.task_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertFalse(self.task.is_active)

    def test_delete_task_twice_is_safe(self):
        first_response = self.client.delete(self.task_detail_url)
        second_response = self.client.delete(self.task_detail_url)
        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)

    def test_member_cannot_delete_task(self):
        self.authenticate(self.member)
        response = self.client.delete(self.task_detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_missing_access_token_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.all_tasks_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_access_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.get(self.all_tasks_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_expired_access_token_returns_401(self):
        refresh = RefreshToken.for_user(self.owner)
        access = refresh.access_token
        access.set_exp(lifetime=-api_settings.ACCESS_TOKEN_LIFETIME)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(access)}")
        response = self.client.get(self.all_tasks_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_inactive_assignee_is_rejected(self):
        self.admin.is_active = False
        self.admin.save(update_fields=["is_active"])
        response = self.client.post(
            self.project_task_list_url,
            {
                "title": "Assign inactive",
                "description": "",
                "assignee_id": self.admin_membership.id,
                "priority": Task.PRIORITY_LOW,
                "status": Task.STATUS_TO_DO,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_ordering_returns_400(self):
        response = self.client.get(f"{self.all_tasks_url}?ordering=bad_field")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_database_error_returns_500_on_create(self):
        with patch("projects.services.task_service.TaskService.create_task", side_effect=DatabaseError("db")):
            response = self.client.post(
                self.project_task_list_url,
                {
                    "title": "DB fail",
                    "description": "",
                    "assignee_id": self.member_membership.id,
                    "priority": Task.PRIORITY_LOW,
                    "status": Task.STATUS_TO_DO,
                },
                format="json",
            )
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
