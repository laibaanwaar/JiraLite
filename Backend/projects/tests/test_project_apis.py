from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import DatabaseError
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from projects.models import Project, ProjectInvitation, ProjectMember
from projects.services.email_service import ProjectInvitationEmailService


User = get_user_model()


class ProjectApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            first_name="Sara",
            last_name="Ahmed",
            email="owner@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
        self.create_url = reverse("project-create")
        self.accept_url = reverse("project-invitation-accept")

    def test_create_project_success(self):
        with patch("projects.services.email_service.send_mail", return_value=1):
            response = self.client.post(
                self.create_url,
                {
                    "name": "JiraLite Development",
                    "description": "Build JiraLite backend.",
                    "invite_emails": ["USER1@gmail.com", "user2@gmail.com", "user1@gmail.com"],
                    "message": "You are invited to work on my project.",
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        project = Project.objects.get(name="JiraLite Development")
        self.assertTrue(ProjectMember.objects.filter(project=project, user=self.user, role=ProjectMember.ROLE_OWNER).exists())
        self.assertEqual(ProjectInvitation.objects.filter(project=project).count(), 2)
        self.assertEqual(response.data["data"]["project"]["current_user_role"], "OWNER")
        self.assertEqual(response.data["data"]["invitation_count"], 2)
        self.assertEqual(
            response.data["data"]["invited_emails"],
            ["user1@gmail.com", "user2@gmail.com"],
        )
        self.assertEqual(
            response.data["data"]["invitations"][0]["email"],
            "user1@gmail.com",
        )

    def test_create_project_requires_authentication(self):
        self.client.credentials()
        response = self.client.post(self.create_url, {"name": "Test"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_project_rejects_self_invite(self):
        response = self.client.post(
            self.create_url,
            {"name": "Test", "invite_emails": ["owner@example.com"]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "You cannot invite yourself to your own project.")

    def test_create_project_rejects_invalid_invite_list(self):
        response = self.client.post(
            self.create_url,
            {"name": "Test", "invite_emails": "not-a-list"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_handles_email_failure(self):
        def side_effect(*args, **kwargs):
            if kwargs["recipient_list"][0] == "user2@gmail.com":
                raise TimeoutError("smtp timeout")
            return 1

        with patch("projects.services.email_service.send_mail", side_effect=side_effect):
            response = self.client.post(
                self.create_url,
                {
                    "name": "Warn Project",
                    "invite_emails": ["user1@gmail.com", "user2@gmail.com"],
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("failed_invitations", response.data["data"])
        self.assertTrue(
            ProjectInvitation.objects.filter(
                invited_email="user2@gmail.com",
                email_status=ProjectInvitation.EMAIL_FAILED,
            ).exists()
        )

    def test_accept_invitation_success(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        invited_user = User.objects.create_user(
            first_name="Ali",
            last_name="Khan",
            email="ali@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        token = ProjectInvitationEmailService.generate_token()
        invitation = ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email=invited_user.email,
            message="Join us",
            role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )

        invited_refresh = RefreshToken.for_user(invited_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(invited_refresh.access_token)}")
        response = self.client.post(self.accept_url, {"token": token}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, ProjectInvitation.STATUS_ACCEPTED)
        self.assertTrue(ProjectMember.objects.filter(project=project, user=invited_user).exists())

    def test_accept_invitation_rejects_email_mismatch(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        invited_user = User.objects.create_user(
            first_name="Ali",
            last_name="Khan",
            email="ali@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        other_user = User.objects.create_user(
            first_name="Other",
            last_name="User",
            email="other@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        token = ProjectInvitationEmailService.generate_token()
        ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email=invited_user.email,
            message="Join us",
            role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )

        other_refresh = RefreshToken.for_user(other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(other_refresh.access_token)}")
        response = self.client.post(self.accept_url, {"token": token}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_accept_invitation_rejects_invalid_token(self):
        response = self.client.post(self.accept_url, {"token": "bad-token"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accept_invitation_rejects_expired_token(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        invited_user = User.objects.create_user(
            first_name="Ali",
            last_name="Khan",
            email="ali2@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        token = ProjectInvitationEmailService.generate_token()
        ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email=invited_user.email,
            message="Join us",
            role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=timezone.now() - timedelta(hours=1),
        )

        invited_refresh = RefreshToken.for_user(invited_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(invited_refresh.access_token)}")
        response = self.client.post(self.accept_url, {"token": token}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accept_invitation_rejects_duplicate_membership(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        invited_user = User.objects.create_user(
            first_name="Ali",
            last_name="Khan",
            email="ali3@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        ProjectMember.objects.create(project=project, user=invited_user, role=ProjectMember.ROLE_MEMBER)
        token = ProjectInvitationEmailService.generate_token()
        ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email=invited_user.email,
            message="Join us",
            role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )

        invited_refresh = RefreshToken.for_user(invited_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(invited_refresh.access_token)}")
        response = self.client.post(self.accept_url, {"token": token}, format="json")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_create_project_handles_database_failure(self):
        with patch(
            "projects.services.project_service.ProjectService.create_project",
            side_effect=DatabaseError("db"),
        ):
            response = self.client.post(self.create_url, {"name": "DB Fail"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
