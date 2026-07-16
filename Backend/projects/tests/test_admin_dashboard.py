from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import DatabaseError
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken

from projects.models import Project, ProjectInvitation, ProjectMember, Task


User = get_user_model()


class AdminDashboardApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            first_name="Owner",
            last_name="User",
            email="owner-dashboard@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        self.admin = User.objects.create_user(
            first_name="Admin",
            last_name="User",
            email="admin-dashboard@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        self.member = User.objects.create_user(
            first_name="Member",
            last_name="User",
            email="member-dashboard@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        self.other = User.objects.create_user(
            first_name="Other",
            last_name="User",
            email="other-dashboard@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )

        self.owner_project = Project.objects.create(
            name="Owner Project",
            description="Managed by owner",
            created_by=self.owner,
        )
        self.admin_project = Project.objects.create(
            name="Admin Project",
            description="Managed by admin role",
            created_by=self.admin,
        )
        self.member_only_project = Project.objects.create(
            name="Member Only Project",
            description="Should be excluded",
            created_by=self.other,
        )

        self.owner_membership = ProjectMember.objects.create(
            project=self.owner_project,
            user=self.owner,
            role=ProjectMember.ROLE_OWNER,
        )
        self.admin_membership = ProjectMember.objects.create(
            project=self.admin_project,
            user=self.owner,
            role=ProjectMember.ROLE_ADMIN,
        )
        self.member_membership = ProjectMember.objects.create(
            project=self.member_only_project,
            user=self.owner,
            role=ProjectMember.ROLE_MEMBER,
        )
        self.owner_project_member_two = ProjectMember.objects.create(
            project=self.owner_project,
            user=self.member,
            role=ProjectMember.ROLE_MEMBER,
        )
        self.admin_project_member_two = ProjectMember.objects.create(
            project=self.admin_project,
            user=self.admin,
            role=ProjectMember.ROLE_OWNER,
        )

        today = timezone.localdate()
        self.owner_task_todo = Task.objects.create(
            project=self.owner_project,
            title="Owner To Do",
            description="todo",
            assignee=self.owner_project_member_two,
            created_by=self.owner,
            priority=Task.PRIORITY_LOW,
            status=Task.STATUS_TO_DO,
            due_date=today + timedelta(days=2),
        )
        self.owner_task_overdue = Task.objects.create(
            project=self.owner_project,
            title="Owner Overdue",
            description="overdue",
            assignee=self.owner_project_member_two,
            created_by=self.owner,
            priority=Task.PRIORITY_HIGH,
            status=Task.STATUS_IN_PROGRESS,
            due_date=today - timedelta(days=1),
        )
        self.owner_task_done_overdue = Task.objects.create(
            project=self.owner_project,
            title="Done Overdue",
            description="completed old task",
            assignee=self.owner_project_member_two,
            created_by=self.owner,
            priority=Task.PRIORITY_MEDIUM,
            status=Task.STATUS_DONE,
            due_date=today - timedelta(days=2),
        )
        self.admin_task_review = Task.objects.create(
            project=self.admin_project,
            title="Admin Review",
            description="review task",
            assignee=self.admin_project_member_two,
            created_by=self.admin,
            priority=Task.PRIORITY_URGENT,
            status=Task.STATUS_IN_REVIEW,
            due_date=today + timedelta(days=1),
        )
        self.admin_task_inactive = Task.objects.create(
            project=self.admin_project,
            title="Inactive Task",
            description="inactive",
            assignee=self.admin_project_member_two,
            created_by=self.admin,
            priority=Task.PRIORITY_HIGH,
            status=Task.STATUS_DONE,
            due_date=today + timedelta(days=5),
            is_active=False,
        )
        self.member_only_task = Task.objects.create(
            project=self.member_only_project,
            title="Excluded Task",
            description="should not count",
            assignee=self.member_membership,
            created_by=self.other,
            priority=Task.PRIORITY_HIGH,
            status=Task.STATUS_IN_PROGRESS,
            due_date=today + timedelta(days=3),
        )

        ProjectInvitation.objects.create(
            project=self.owner_project,
            invited_by=self.owner,
            invited_email="pending@example.com",
            role=ProjectMember.ROLE_MEMBER,
            token_hash="a" * 64,
            status=ProjectInvitation.STATUS_PENDING,
            expires_at=timezone.now() + timedelta(days=1),
        )
        ProjectInvitation.objects.create(
            project=self.admin_project,
            invited_by=self.admin,
            invited_email="accepted@example.com",
            role=ProjectMember.ROLE_MEMBER,
            token_hash="b" * 64,
            status=ProjectInvitation.STATUS_ACCEPTED,
            expires_at=timezone.now() + timedelta(days=1),
        )

        self.url = reverse("admin-dashboard")
        refresh = RefreshToken.for_user(self.owner)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def test_authenticated_owner_receives_dashboard(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["view"], "admin")
        self.assertIsNone(response.data["data"]["selected_project"])
        self.assertEqual(response.data["data"]["summary"]["total_projects"], 2)
        self.assertEqual(response.data["data"]["summary"]["total_members"], 4)
        self.assertEqual(response.data["data"]["summary"]["total_tasks"], 4)
        self.assertEqual(response.data["data"]["summary"]["to_do_tasks"], 1)
        self.assertEqual(response.data["data"]["summary"]["in_progress_tasks"], 1)
        self.assertEqual(response.data["data"]["summary"]["in_review_tasks"], 1)
        self.assertEqual(response.data["data"]["summary"]["completed_tasks"], 1)
        self.assertEqual(response.data["data"]["summary"]["overdue_tasks"], 1)
        self.assertEqual(response.data["data"]["summary"]["pending_invitations"], 1)
        self.assertTrue(response.data["data"]["permissions"]["can_create_task"])

    def test_authenticated_admin_receives_dashboard(self):
        admin_only_user = User.objects.create_user(
            first_name="Solo",
            last_name="Admin",
            email="solo-admin@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        project = Project.objects.create(name="Solo Project", description="", created_by=self.owner)
        ProjectMember.objects.create(project=project, user=admin_only_user, role=ProjectMember.ROLE_ADMIN)
        ProjectMember.objects.create(project=project, user=self.owner, role=ProjectMember.ROLE_OWNER)
        self.authenticate(admin_only_user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["summary"]["total_projects"], 1)

    def test_unauthenticated_request_returns_401(self):
        self.client.credentials()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_with_no_managed_projects_receives_zero_dashboard(self):
        self.authenticate(self.member)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["summary"]["total_projects"], 0)
        self.assertEqual(response.data["data"]["summary"]["total_tasks"], 0)
        self.assertFalse(response.data["data"]["permissions"]["can_create_task"])
        self.assertEqual(response.data["data"]["tasks_by_status"][0]["count"], 0)

    def test_project_specific_dashboard_works(self):
        response = self.client.get(f"{self.url}?project_id={self.owner_project.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Project admin dashboard retrieved successfully.")
        self.assertEqual(response.data["data"]["selected_project"]["id"], self.owner_project.id)
        self.assertEqual(response.data["data"]["summary"]["total_projects"], 1)
        self.assertEqual(response.data["data"]["summary"]["total_tasks"], 3)
        self.assertEqual(response.data["data"]["summary"]["completed_tasks"], 1)

    def test_member_cannot_access_project_specific_admin_dashboard(self):
        self.authenticate(self.member)
        response = self.client.get(f"{self.url}?project_id={self.owner_project.id}")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_project_id_returns_400(self):
        response = self.client.get(f"{self.url}?project_id=abc")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_project_returns_404(self):
        response = self.client.get(f"{self.url}?project_id=999999")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_member_only_project_is_excluded_and_recent_lists_are_limited(self):
        for index in range(6):
            project = Project.objects.create(
                name=f"Extra Project {index}",
                description="extra",
                created_by=self.owner,
            )
            membership = ProjectMember.objects.create(
                project=project,
                user=self.owner,
                role=ProjectMember.ROLE_OWNER,
            )
            Task.objects.create(
                project=project,
                title=f"Task {index}",
                description="recent",
                assignee=membership,
                created_by=self.owner,
                priority=Task.PRIORITY_LOW,
                status=Task.STATUS_TO_DO,
                due_date=timezone.localdate() + timedelta(days=index + 1),
            )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        recent_projects = response.data["data"]["recent_projects"]
        recent_tasks = response.data["data"]["recent_tasks"]
        upcoming_deadlines = response.data["data"]["upcoming_deadlines"]
        self.assertLessEqual(len(recent_projects), 5)
        self.assertLessEqual(len(recent_tasks), 5)
        self.assertLessEqual(len(upcoming_deadlines), 5)
        returned_task_ids = {task["id"] for task in recent_tasks}
        self.assertNotIn(self.member_only_task.id, returned_task_ids)

    def test_task_status_and_priority_groups_are_correct(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        status_counts = {item["status"]: item["count"] for item in response.data["data"]["tasks_by_status"]}
        priority_counts = {item["priority"]: item["count"] for item in response.data["data"]["tasks_by_priority"]}
        self.assertEqual(status_counts[Task.STATUS_TO_DO], 1)
        self.assertEqual(status_counts[Task.STATUS_IN_PROGRESS], 1)
        self.assertEqual(status_counts[Task.STATUS_IN_REVIEW], 1)
        self.assertEqual(status_counts[Task.STATUS_DONE], 1)
        self.assertEqual(priority_counts[Task.PRIORITY_LOW], 1)
        self.assertEqual(priority_counts[Task.PRIORITY_MEDIUM], 1)
        self.assertEqual(priority_counts[Task.PRIORITY_HIGH], 1)
        self.assertEqual(priority_counts[Task.PRIORITY_URGENT], 1)

    def test_upcoming_deadlines_are_ordered_and_sensitive_fields_are_not_returned(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        deadlines = response.data["data"]["upcoming_deadlines"]
        self.assertEqual(deadlines[0]["task_id"], self.admin_task_review.id)
        self.assertNotIn("email", deadlines[0]["assignee"])
        self.assertNotIn("password", str(response.data))

    def test_zero_task_completion_percentage_does_not_fail(self):
        empty_project = Project.objects.create(name="Empty Project", description="", created_by=self.owner)
        ProjectMember.objects.create(project=empty_project, user=self.owner, role=ProjectMember.ROLE_OWNER)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        empty_item = next(item for item in response.data["data"]["recent_projects"] if item["id"] == empty_project.id)
        self.assertEqual(empty_item["completion_percentage"], 0)

    def test_database_failure_returns_safe_500_response(self):
        with patch(
            "projects.services.admin_dashboard_service.AdminDashboardService.get_admin_dashboard",
            side_effect=DatabaseError("db"),
        ):
            response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_unexpected_exception_returns_safe_500_response(self):
        with patch(
            "projects.services.admin_dashboard_service.AdminDashboardService.get_admin_dashboard",
            side_effect=Exception("boom"),
        ):
            response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
