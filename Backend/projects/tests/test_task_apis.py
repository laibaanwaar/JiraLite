from datetime import date, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import DatabaseError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import Role
from projects.models import Project, ProjectMember, Task, TaskComment


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
        self.member.role = Role.objects.get(code="MEMBER")
        self.member.save(update_fields=["role"])

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
        self.my_tasks_alias_url = reverse("my-task-list")
        self.task_detail_url = reverse("task-detail", kwargs={"task_id": self.task.id})
        self.task_comments_url = reverse("task-comment-list", kwargs={"task_id": self.task.id})

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
        self.other.role = Role.objects.get(code="MEMBER")
        self.other.save(update_fields=["role"])
        self.authenticate(self.other)
        response = self.client.get(self.project_task_list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_project_task_list_returns_only_selected_project_tasks(self):
        owner_task = Task.objects.create(
            project=self.project,
            title="Owner Project Task",
            description="Task in selected project.",
            assignee=self.owner_membership,
            created_by=self.owner,
            priority=Task.PRIORITY_MEDIUM,
            status=Task.STATUS_TO_DO,
            due_date=date.today() + timedelta(days=2),
        )

        response = self.client.get(self.project_task_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item["id"] for item in response.data["data"]["results"]}
        self.assertIn(self.task.id, returned_ids)
        self.assertIn(owner_task.id, returned_ids)
        self.assertNotIn(self.other_task.id, returned_ids)

    def test_project_member_can_list_only_assigned_tasks_in_their_project(self):
        admin_task = Task.objects.create(
            project=self.project,
            title="Admin Assigned Task",
            description="Visible to project members.",
            assignee=self.admin_membership,
            created_by=self.owner,
            priority=Task.PRIORITY_MEDIUM,
            status=Task.STATUS_TO_DO,
            due_date=date.today() + timedelta(days=2),
        )
        self.authenticate(self.member)

        response = self.client.get(self.project_task_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item["id"] for item in response.data["data"]["results"]}
        self.assertIn(self.task.id, returned_ids)
        self.assertNotIn(admin_task.id, returned_ids)
        self.assertNotIn(self.other_task.id, returned_ids)

    def test_project_task_list_returns_404_for_missing_project(self):
        response = self.client.get(reverse("project-task-list", kwargs={"project_id": 99999}))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

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

    def test_admin_global_tasks_returns_all_active_tasks(self):
        owner_task = Task.objects.create(
            project=self.project,
            title="Owner Assigned Task",
            description="Visible to the assigned owner.",
            assignee=self.owner_membership,
            created_by=self.owner,
            priority=Task.PRIORITY_MEDIUM,
            status=Task.STATUS_TO_DO,
            due_date=date.today() + timedelta(days=2),
        )

        response = self.client.get(self.all_tasks_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item["id"] for item in response.data["data"]["results"]}
        self.assertIn(owner_task.id, returned_ids)
        self.assertIn(self.task.id, returned_ids)
        self.assertIn(self.other_task.id, returned_ids)

    def test_member_global_tasks_is_forbidden(self):
        self.authenticate(self.member)

        response = self.client.get(self.all_tasks_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "Permission denied.")

    def test_all_tasks_ignores_default_all_filter_values(self):
        response = self.client.get(
            f"{self.all_tasks_url}?project_id=all&status=All%20Status&priority=All%20Priority&search=&page=undefined&page_size=undefined"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data["data"])

    def test_my_tasks_only_returns_assigned_tasks(self):
        self.authenticate(self.member)
        response = self.client.get(self.my_tasks_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 1)
        self.assertEqual(response.data["data"]["results"][0]["id"], self.task.id)

    def test_my_tasks_alias_only_returns_assigned_tasks(self):
        self.authenticate(self.member)
        response = self.client.get(self.my_tasks_alias_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 1)
        self.assertEqual(response.data["data"]["results"][0]["id"], self.task.id)

    def test_member_can_view_assigned_task_detail(self):
        self.authenticate(self.member)

        response = self.client.get(self.task_detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["id"], self.task.id)

    def test_member_cannot_view_unassigned_task_detail_in_their_project(self):
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

        response = self.client.get(reverse("task-detail", kwargs={"task_id": admin_task.id}))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_task_detail_rejects_non_project_member(self):
        self.authenticate(self.member)
        other_task_url = reverse("task-detail", kwargs={"task_id": self.other_task.id})
        response = self.client.get(other_task_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_task_detail_returns_404_for_missing_task(self):
        response = self.client.get(reverse("task-detail", kwargs={"task_id": 99999}))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_task_detail_returns_required_fields_for_admin(self):
        response = self.client.get(self.task_detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["title"], self.task.title)
        self.assertEqual(response.data["data"]["description"], self.task.description)
        self.assertEqual(response.data["data"]["project"]["id"], self.project.id)
        self.assertEqual(response.data["data"]["assignee"]["project_member_id"], self.member_membership.id)
        self.assertIn("status", response.data["data"])
        self.assertIn("priority", response.data["data"])
        self.assertIn("due_date", response.data["data"])
        self.assertIn("created_at", response.data["data"])
        self.assertIn("updated_at", response.data["data"])

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

    def test_member_can_update_own_task_status(self):
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

    def test_project_task_list_includes_comment_count(self):
        TaskComment.objects.create(task=self.task, author=self.owner, content="First comment")
        TaskComment.objects.create(task=self.task, author=self.member, content="Second comment")

        response = self.client.get(self.project_task_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task_data = next(item for item in response.data["data"]["results"] if item["id"] == self.task.id)
        self.assertEqual(task_data["comment_count"], 2)

    def test_project_member_can_create_task_comment(self):
        self.authenticate(self.member)

        response = self.client.post(
            self.task_comments_url,
            {"content": "I started working on this."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TaskComment.objects.filter(task=self.task, author=self.member).count(), 1)
        self.assertEqual(response.data["data"]["content"], "I started working on this.")
        self.assertEqual(response.data["data"]["author"]["id"], self.member.id)
        self.assertEqual(response.data["data"]["author"]["name"], "Member User")
        self.assertEqual(response.data["data"]["author"]["email"], self.member.email)
        self.assertEqual(response.data["data"]["author"]["role"]["code"], "MEMBER")
        self.assertEqual(response.data["data"]["author"]["initials"], "MU")
        self.assertTrue(response.data["data"]["can_edit"])
        self.assertTrue(response.data["data"]["can_delete"])

    def test_project_member_can_list_comments_for_project_task(self):
        owner_comment = TaskComment.objects.create(task=self.task, author=self.owner, content="Owner note")
        member_comment = TaskComment.objects.create(task=self.task, author=self.member, content="Member note")
        TaskComment.objects.create(task=self.other_task, author=self.other, content="Other project note")
        self.authenticate(self.member)

        response = self.client.get(self.task_comments_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 2)
        returned_ids = {item["id"] for item in response.data["data"]["results"]}
        self.assertEqual(returned_ids, {owner_comment.id, member_comment.id})
        owner_data = next(item for item in response.data["data"]["results"] if item["id"] == owner_comment.id)
        member_data = next(item for item in response.data["data"]["results"] if item["id"] == member_comment.id)
        self.assertFalse(owner_data["can_edit"])
        self.assertFalse(owner_data["can_delete"])
        self.assertTrue(member_data["can_edit"])
        self.assertTrue(member_data["can_delete"])

    def test_comment_list_returns_404_for_missing_task(self):
        response = self.client.get(reverse("task-comment-list", kwargs={"task_id": 99999}))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_non_member_cannot_list_or_create_task_comments(self):
        outsider = User.objects.create_user(
            first_name="No",
            last_name="Member",
            email="nomember@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        self.authenticate(outsider)

        list_response = self.client.get(self.task_comments_url)
        create_response = self.client.post(
            self.task_comments_url,
            {"content": "Trying to join in."},
            format="json",
        )

        self.assertEqual(list_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(TaskComment.objects.filter(task=self.task, author=outsider).exists())

    def test_cross_project_member_cannot_access_task_comments(self):
        self.authenticate(self.other)

        response = self.client.get(self.task_comments_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_comment_author_can_update_own_comment(self):
        comment = TaskComment.objects.create(task=self.task, author=self.member, content="Old content")
        self.authenticate(self.member)

        response = self.client.patch(
            reverse("task-comment-detail", kwargs={"comment_id": comment.id}),
            {"content": "Updated content"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        comment.refresh_from_db()
        self.assertEqual(comment.content, "Updated content")
        self.assertEqual(response.data["data"]["content"], "Updated content")

    def test_comment_author_can_delete_own_comment(self):
        comment = TaskComment.objects.create(task=self.task, author=self.member, content="Remove me")
        self.authenticate(self.member)

        response = self.client.delete(reverse("task-comment-detail", kwargs={"comment_id": comment.id}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(TaskComment.objects.filter(id=comment.id).exists())

    def test_admin_cannot_update_or_delete_another_users_comment(self):
        comment = TaskComment.objects.create(task=self.task, author=self.member, content="Member note")
        self.authenticate(self.admin)

        update_response = self.client.patch(
            reverse("task-comment-detail", kwargs={"comment_id": comment.id}),
            {"content": "Admin edit"},
            format="json",
        )
        delete_response = self.client.delete(reverse("task-comment-detail", kwargs={"comment_id": comment.id}))

        self.assertEqual(update_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)
        comment.refresh_from_db()
        self.assertEqual(comment.content, "Member note")

    def test_task_assignee_cannot_modify_another_users_comment(self):
        comment = TaskComment.objects.create(task=self.task, author=self.owner, content="Owner note")
        self.authenticate(self.member)

        response = self.client.patch(
            reverse("task-comment-detail", kwargs={"comment_id": comment.id}),
            {"content": "Assignee edit"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        comment.refresh_from_db()
        self.assertEqual(comment.content, "Owner note")

    def test_cross_project_member_cannot_update_comment(self):
        comment = TaskComment.objects.create(task=self.task, author=self.member, content="Project note")
        self.authenticate(self.other)

        response = self.client.patch(
            reverse("task-comment-detail", kwargs={"comment_id": comment.id}),
            {"content": "Cross-project edit"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        comment.refresh_from_db()
        self.assertEqual(comment.content, "Project note")

    def test_update_missing_comment_returns_404(self):
        response = self.client.patch(
            reverse("task-comment-detail", kwargs={"comment_id": 99999}),
            {"content": "Missing"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

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
