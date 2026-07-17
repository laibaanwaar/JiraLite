from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import DatabaseError
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import UserProfile
from projects.models import Project, ProjectInvitation, ProjectMember, Task
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
        self.my_projects_url = reverse("my-project-list")
        self.preview_url = reverse("project-invitation-preview")
        self.accept_url = reverse("project-invitation-accept")
        self.reject_url = reverse("project-invitation-reject")
        self.respond_page_url = reverse("project-invitation-respond-page")

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

    def test_create_project_rejects_inactive_user(self):
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])

        response = self.client.post(self.create_url, {"name": "Inactive Project"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "User account is inactive.")

    def test_create_project_rejects_unverified_user(self):
        self.user.is_email_verified = False
        self.user.save(update_fields=["is_email_verified"])

        response = self.client.post(self.create_url, {"name": "Unverified Project"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "Email verification is required.")

    def test_list_projects_returns_current_user_role(self):
        owned_project = Project.objects.create(
            name="Owned Project",
            description="Owned by user",
            created_by=self.user,
        )
        ProjectMember.objects.create(
            project=owned_project,
            user=self.user,
            role=ProjectMember.ROLE_OWNER,
        )

        admin_user = User.objects.create_user(
            first_name="Admin",
            last_name="User",
            email="admin-project@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        admin_project = Project.objects.create(
            name="Admin Project",
            description="Admin access",
            created_by=admin_user,
        )
        ProjectMember.objects.create(
            project=admin_project,
            user=admin_user,
            role=ProjectMember.ROLE_OWNER,
        )
        ProjectMember.objects.create(
            project=admin_project,
            user=self.user,
            role=ProjectMember.ROLE_ADMIN,
        )

        response = self.client.get(self.create_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["count"], 2)
        self.assertIsNone(response.data["data"]["next"])
        self.assertIsNone(response.data["data"]["previous"])
        roles_by_name = {project["name"]: project["current_user_role"] for project in response.data["data"]["results"]}
        self.assertEqual(roles_by_name["Owned Project"], ProjectMember.ROLE_OWNER)
        self.assertEqual(roles_by_name["Admin Project"], ProjectMember.ROLE_ADMIN)

    def test_list_projects_requires_authentication(self):
        self.client.credentials()
        response = self.client.get(self.create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_projects_returns_counts_permissions_filters_and_search(self):
        owner_project = Project.objects.create(
            name="Website Redesign",
            description="Modern UI work",
            created_by=self.user,
        )
        owner_membership = ProjectMember.objects.create(
            project=owner_project,
            user=self.user,
            role=ProjectMember.ROLE_OWNER,
        )
        member_user = User.objects.create_user(
            first_name="Member",
            last_name="User",
            email="project-table-member@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        ProjectMember.objects.create(
            project=owner_project,
            user=member_user,
            role=ProjectMember.ROLE_MEMBER,
        )
        Task.objects.create(
            project=owner_project,
            title="Active task",
            assignee=owner_membership,
            created_by=self.user,
            is_active=True,
        )
        Task.objects.create(
            project=owner_project,
            title="Inactive task",
            assignee=owner_membership,
            created_by=self.user,
            is_active=False,
        )
        admin_owner = User.objects.create_user(
            first_name="Other",
            last_name="Owner",
            email="project-table-owner@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        admin_project = Project.objects.create(
            name="Mobile App",
            description="Native build",
            created_by=admin_owner,
        )
        ProjectMember.objects.create(project=admin_project, user=admin_owner, role=ProjectMember.ROLE_OWNER)
        ProjectMember.objects.create(project=admin_project, user=self.user, role=ProjectMember.ROLE_ADMIN)

        response = self.client.get(f"{self.create_url}?role=OWNER&search=website&ordering=name&page=1&page_size=5")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 1)
        project = response.data["data"]["results"][0]
        self.assertEqual(project["name"], "Website Redesign")
        self.assertEqual(project["current_user_role"], ProjectMember.ROLE_OWNER)
        self.assertEqual(project["total_members"], 2)
        self.assertEqual(project["total_tasks"], 1)
        self.assertTrue(project["permissions"]["can_delete"])
        self.assertTrue(project["permissions"]["can_create_task"])
        self.assertNotIn("token", project)
        self.assertNotIn("token_hash", project)

    def test_list_projects_rejects_invalid_role_filter(self):
        response = self.client.get(f"{self.create_url}?role=MANAGER")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Invalid role filter.")
        self.assertEqual(response.data["errors"]["role"], ["Allowed values are OWNER, ADMIN, and MEMBER."])

    def test_list_projects_empty_response_is_successful(self):
        ProjectMember.objects.filter(user=self.user).delete()

        response = self.client.get(self.create_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 0)
        self.assertEqual(response.data["data"]["results"], [])

    def test_project_detail_update_and_delete_permissions(self):
        project = Project.objects.create(name="Detail Project", description="Before", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        detail_url = reverse("project-detail", kwargs={"project_id": project.id})

        detail_response = self.client.get(detail_url)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data["data"]["name"], "Detail Project")
        self.assertTrue(detail_response.data["data"]["permissions"]["can_edit"])

        patch_response = self.client.patch(
            detail_url,
            {"name": "Updated Project", "description": "After"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_response.data["data"]["name"], "Updated Project")

        member_user = User.objects.create_user(
            first_name="Member",
            last_name="Only",
            email="member-project-detail@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        ProjectMember.objects.create(project=project, user=member_user, role=ProjectMember.ROLE_MEMBER)
        member_refresh = RefreshToken.for_user(member_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(member_refresh.access_token)}")
        member_patch_response = self.client.patch(detail_url, {"name": "Nope"}, format="json")
        member_delete_response = self.client.delete(detail_url)
        self.assertEqual(member_patch_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(member_delete_response.status_code, status.HTTP_403_FORBIDDEN)

        owner_refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(owner_refresh.access_token)}")
        delete_response = self.client.delete(detail_url)
        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)
        project.refresh_from_db()
        self.assertFalse(project.is_active)

    def test_project_detail_hides_non_member_project(self):
        other_user = User.objects.create_user(
            first_name="Other",
            last_name="User",
            email="other-project-detail@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        project = Project.objects.create(name="Other Project", description="", created_by=other_user)
        ProjectMember.objects.create(project=project, user=other_user, role=ProjectMember.ROLE_OWNER)

        response = self.client.get(reverse("project-detail", kwargs={"project_id": project.id}))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_project_members_success(self):
        project = Project.objects.create(name="Member Project", description="", created_by=self.user)
        owner_membership = ProjectMember.objects.create(
            project=project,
            user=self.user,
            role=ProjectMember.ROLE_OWNER,
        )
        member_user = User.objects.create_user(
            first_name="Ali",
            last_name="Khan",
            email="member-list@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        member_membership = ProjectMember.objects.create(
            project=project,
            user=member_user,
            role=ProjectMember.ROLE_MEMBER,
        )

        response = self.client.get(reverse("project-member-list", kwargs={"project_id": project.id}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        returned_ids = {item["project_member_id"] for item in response.data["data"]}
        self.assertEqual(returned_ids, {owner_membership.id, member_membership.id})

    def test_list_project_members_hides_inaccessible_project(self):
        other_user = User.objects.create_user(
            first_name="Other",
            last_name="User",
            email="other-project-member@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        other_project = Project.objects.create(name="Other Project", description="", created_by=other_user)
        ProjectMember.objects.create(
            project=other_project,
            user=other_user,
            role=ProjectMember.ROLE_OWNER,
        )

        response = self.client.get(reverse("project-member-list", kwargs={"project_id": other_project.id}))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

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

    def test_create_project_rejects_restricted_fields(self):
        response = self.client.post(
            self.create_url,
            {"name": "Restricted", "created_by": 999, "role": "OWNER"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["errors"]["created_by"], ["This field is not allowed."])
        self.assertEqual(response.data["errors"]["role"], ["This field is not allowed."])

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

    def test_project_admin_can_send_invitation_via_new_endpoint(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)

        with patch("projects.services.email_service.send_mail", return_value=1):
            response = self.client.post(
                reverse("project-invitation-create", kwargs={"project_id": project.id}),
                {"email": "member@example.com", "project_role": ProjectMember.ROLE_MEMBER},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["invited_email"], "member@example.com")
        self.assertEqual(response.data["data"]["project_role"], ProjectMember.ROLE_MEMBER)
        self.assertTrue(
            ProjectInvitation.objects.filter(
                project=project,
                invited_email="member@example.com",
                status=ProjectInvitation.STATUS_PENDING,
            ).exists()
        )

    def test_project_admin_can_invite_any_valid_non_member_email(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        User.objects.create_user(
            first_name="Existing",
            last_name="User",
            email="existing-valid@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )

        with patch("projects.services.email_service.send_mail", return_value=1):
            response = self.client.post(
                reverse("project-invitation-create", kwargs={"project_id": project.id}),
                {"email": " Existing-Valid@Example.com "},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["invited_email"], "existing-valid@example.com")

    def test_member_cannot_send_invitation_via_new_endpoint(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        member_user = User.objects.create_user(
            first_name="Member",
            last_name="Only",
            email="member-only@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        ProjectMember.objects.create(project=project, user=member_user, role=ProjectMember.ROLE_MEMBER)
        member_refresh = RefreshToken.for_user(member_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(member_refresh.access_token)}")

        response = self.client.post(
            reverse("project-invitation-create", kwargs={"project_id": project.id}),
            {"email": "newmember@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_pending_invitation_is_rejected_on_new_endpoint(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email="duplicate@example.com",
            project_role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(ProjectInvitationEmailService.generate_token()),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )

        response = self.client.post(
            reverse("project-invitation-create", kwargs={"project_id": project.id}),
            {"email": "duplicate@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["errors"]["email"], ["A pending invitation already exists for this email."])

    def test_invitation_detail_endpoint_returns_account_state(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        token = ProjectInvitationEmailService.generate_token()
        ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email="detail@example.com",
            project_role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )

        response = self.client.get(reverse("invitation-detail", kwargs={"token": token}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["email"], "detail@example.com")
        self.assertFalse(response.data["data"]["account_exists"])
        self.assertFalse(response.data["data"]["expired"])

    def test_invitation_detail_returns_account_exists_true_for_exact_invited_email(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        User.objects.create_user(
            first_name="Detail",
            last_name="User",
            email="detail-existing@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        User.objects.create_user(
            first_name="Partial",
            last_name="User",
            email="xdetail-existing@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        token = ProjectInvitationEmailService.generate_token()
        ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email="DETAIL-EXISTING@example.com",
            project_role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )

        response = self.client.get(reverse("invitation-detail", kwargs={"token": token}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["invited_email"], "detail-existing@example.com")
        self.assertTrue(response.data["data"]["account_exists"])
        self.assertTrue(response.data["data"]["show_name_password_form"])
        self.assertEqual(response.data["data"]["inviter"]["name"], "Sara Ahmed")

    def test_invitation_detail_returns_account_exists_false_for_inactive_invited_email(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        User.objects.create_user(
            first_name="Inactive",
            last_name="User",
            email="inactive-invited@example.com",
            password="UserPassword@123",
            is_email_verified=False,
            is_active=False,
        )
        token = ProjectInvitationEmailService.generate_token()
        ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email="inactive-invited@example.com",
            project_role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )

        response = self.client.get(reverse("invitation-detail", kwargs={"token": token}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["data"]["account_exists"])

    def test_invitation_detail_ignores_different_logged_in_account(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        other_user = User.objects.create_user(
            first_name="Other",
            last_name="User",
            email="other-detail@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        token = ProjectInvitationEmailService.generate_token()
        ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email="new-detail@example.com",
            project_role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )
        other_refresh = RefreshToken.for_user(other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(other_refresh.access_token)}")

        response = self.client.get(reverse("invitation-detail", kwargs={"token": token}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["invited_email"], "new-detail@example.com")
        self.assertFalse(response.data["data"]["account_exists"])

    def test_invitation_detail_rejects_non_pending_invitation(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        token = ProjectInvitationEmailService.generate_token()
        ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email="accepted-detail@example.com",
            project_role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            status=ProjectInvitation.STATUS_ACCEPTED,
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )

        response = self.client.get(reverse("invitation-detail", kwargs={"token": token}))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "This invitation is no longer pending.")

    def test_new_user_can_accept_invitation_and_is_created_as_member(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        token = ProjectInvitationEmailService.generate_token()
        invitation = ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email="invited-new@example.com",
            project_role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )

        response = self.client.post(
            reverse("invitation-accept", kwargs={"token": token}),
            {
                "first_name": "Ali",
                "last_name": "Khan",
                "password": "StrongPassword123!",
                "confirm_password": "StrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invited_user = User.objects.get(email="invited-new@example.com")
        self.assertEqual(invited_user.role.code, "MEMBER")
        self.assertTrue(invited_user.check_password("StrongPassword123!"))
        self.assertNotEqual(invited_user.password, "StrongPassword123!")
        self.assertTrue(UserProfile.objects.filter(user=invited_user).exists())
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])
        self.assertEqual(response.data["data"]["user"]["email"], invited_user.email)
        self.assertEqual(response.data["data"]["user"]["role"]["code"], "MEMBER")
        self.assertTrue(ProjectMember.objects.filter(project=project, user=invited_user).exists())
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, ProjectInvitation.STATUS_ACCEPTED)

    def test_inactive_invited_user_can_set_password_and_is_activated_as_member(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        inactive_user = User.objects.create_user(
            first_name="Old",
            last_name="Name",
            email="activate-me@example.com",
            password="OldPassword123!",
            is_email_verified=False,
            is_active=False,
        )
        token = ProjectInvitationEmailService.generate_token()
        invitation = ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email="activate-me@example.com",
            project_role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )
        user_count_before = User.objects.count()

        response = self.client.post(
            reverse("invitation-accept", kwargs={"token": token}),
            {
                "first_name": "New",
                "last_name": "Member",
                "password": "StrongPassword123!",
                "confirm_password": "StrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        inactive_user.refresh_from_db()
        self.assertEqual(User.objects.count(), user_count_before)
        self.assertTrue(inactive_user.is_active)
        self.assertTrue(inactive_user.is_email_verified)
        self.assertEqual(inactive_user.role.code, "MEMBER")
        self.assertTrue(inactive_user.check_password("StrongPassword123!"))
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])
        self.assertTrue(ProjectMember.objects.filter(project=project, user=inactive_user).exists())
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, ProjectInvitation.STATUS_ACCEPTED)

    def test_new_invited_user_can_create_account_while_another_account_is_logged_in(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        other_user = User.objects.create_user(
            first_name="Other",
            last_name="User",
            email="other-session@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        token = ProjectInvitationEmailService.generate_token()
        invitation = ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email="brand-new@example.com",
            project_role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )
        other_refresh = RefreshToken.for_user(other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(other_refresh.access_token)}")

        response = self.client.post(
            reverse("invitation-accept", kwargs={"token": token}),
            {
                "first_name": "Brand",
                "last_name": "New",
                "password": "StrongPassword123!",
                "confirm_password": "StrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invited_user = User.objects.get(email="brand-new@example.com")
        self.assertNotEqual(invited_user.id, other_user.id)
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])
        self.assertEqual(response.data["data"]["user"]["role"]["code"], "MEMBER")
        self.assertTrue(ProjectMember.objects.filter(project=project, user=invited_user).exists())
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, ProjectInvitation.STATUS_ACCEPTED)

    def test_existing_active_invited_user_accept_overwrites_password_and_role(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        invited_user = User.objects.create_user(
            first_name="Invited",
            last_name="User",
            email="existing-invite@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        admin_role = invited_user.role
        other_user = User.objects.create_user(
            first_name="Other",
            last_name="User",
            email="other-existing@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        token = ProjectInvitationEmailService.generate_token()
        ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email=invited_user.email,
            project_role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )
        other_refresh = RefreshToken.for_user(other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(other_refresh.access_token)}")
        user_count_before = User.objects.count()
        original_password_hash = invited_user.password

        response = self.client.post(
            reverse("invitation-accept", kwargs={"token": token}),
            {
                "first_name": "Ignored",
                "last_name": "Name",
                "password": "NewStrongPassword123!",
                "confirm_password": "NewStrongPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invited_user.refresh_from_db()
        self.assertEqual(User.objects.count(), user_count_before)
        self.assertNotEqual(invited_user.password, original_password_hash)
        self.assertTrue(invited_user.check_password("NewStrongPassword123!"))
        self.assertEqual(invited_user.role.code, "MEMBER")
        self.assertNotEqual(invited_user.role_id, admin_role.id)
        self.assertEqual(invited_user.first_name, "Ignored")
        self.assertEqual(invited_user.last_name, "Name")
        self.assertTrue(ProjectMember.objects.filter(project=project, user=invited_user).exists())
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])

    def test_existing_active_invited_user_can_set_new_password_from_invitation(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        invited_user = User.objects.create_user(
            first_name="Invited",
            last_name="User",
            email="login-required@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        token = ProjectInvitationEmailService.generate_token()
        ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email=invited_user.email,
            project_role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )
        self.client.credentials()
        user_count_before = User.objects.count()

        response = self.client.post(
            reverse("invitation-accept", kwargs={"token": token}),
            {
                "first_name": "Invited",
                "last_name": "User",
                "password": "ReplacementPassword123!",
                "confirm_password": "ReplacementPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invited_user.refresh_from_db()
        self.assertEqual(User.objects.count(), user_count_before)
        self.assertTrue(invited_user.check_password("ReplacementPassword123!"))
        self.assertEqual(invited_user.role.code, "MEMBER")
        self.assertTrue(ProjectMember.objects.filter(project=project, user=invited_user).exists())
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])

    def test_existing_user_accept_email_comparison_is_case_insensitive(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        invited_user = User.objects.create_user(
            first_name="Invited",
            last_name="User",
            email="case-invite@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        token = ProjectInvitationEmailService.generate_token()
        invitation = ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email="CASE-INVITE@EXAMPLE.COM",
            project_role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )
        invited_refresh = RefreshToken.for_user(invited_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(invited_refresh.access_token)}")
        user_count_before = User.objects.count()

        response = self.client.post(
            reverse("invitation-accept", kwargs={"token": token}),
            {
                "first_name": "Ignored",
                "last_name": "Name",
                "password": "CaseReplacement123!",
                "confirm_password": "CaseReplacement123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invited_user.refresh_from_db()
        self.assertEqual(User.objects.count(), user_count_before)
        self.assertTrue(invited_user.check_password("CaseReplacement123!"))
        self.assertEqual(invited_user.role.code, "MEMBER")
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])
        self.assertTrue(ProjectMember.objects.filter(project=project, user=invited_user).exists())
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, ProjectInvitation.STATUS_ACCEPTED)

    def test_accepted_invitation_token_cannot_be_reused(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        token = ProjectInvitationEmailService.generate_token()
        invitation = ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email="reuse-check@example.com",
            project_role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )
        payload = {
            "first_name": "Reuse",
            "last_name": "Check",
            "password": "StrongPassword123!",
            "confirm_password": "StrongPassword123!",
        }

        first_response = self.client.post(reverse("invitation-accept", kwargs={"token": token}), payload, format="json")
        second_response = self.client.post(reverse("invitation-accept", kwargs={"token": token}), payload, format="json")

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(second_response.data["message"], "This invitation is no longer pending.")
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, ProjectInvitation.STATUS_ACCEPTED)
        self.assertEqual(ProjectMember.objects.filter(project=project, user__email="reuse-check@example.com").count(), 1)

    def test_public_reject_endpoint_marks_invitation_rejected(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        token = ProjectInvitationEmailService.generate_token()
        invitation = ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email="reject-public@example.com",
            project_role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )

        response = self.client.post(reverse("invitation-reject", kwargs={"token": token}), {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, ProjectInvitation.STATUS_REJECTED)
        self.assertIsNotNone(invitation.rejected_at)

    def test_my_projects_alias_returns_member_projects(self):
        project = Project.objects.create(name="Alias Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)

        response = self.client.get(self.my_projects_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 1)

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

    def test_preview_invitation_success(self):
        project = Project.objects.create(name="Invite Project", description="desc", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        invited_user = User.objects.create_user(
            first_name="Ali",
            last_name="Khan",
            email="preview@example.com",
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

        invited_refresh = RefreshToken.for_user(invited_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(invited_refresh.access_token)}")
        response = self.client.get(f"{self.preview_url}?token={token}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["project"]["name"], "Invite Project")
        self.assertTrue(response.data["data"]["can_accept"])
        self.assertTrue(response.data["data"]["can_reject"])

    def test_reject_invitation_success(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        invited_user = User.objects.create_user(
            first_name="Ali",
            last_name="Khan",
            email="reject@example.com",
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
        response = self.client.post(self.reject_url, {"token": token}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, ProjectInvitation.STATUS_REJECTED)
        self.assertFalse(ProjectMember.objects.filter(project=project, user=invited_user).exists())

    def test_invitation_response_page_accept_does_not_bypass_api_accept_flow(self):
        project = Project.objects.create(name="Invite Project", description="Backend work", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        invited_user = User.objects.create_user(
            first_name="Musa",
            last_name="Arfah",
            email="musa@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        token = ProjectInvitationEmailService.generate_token()
        invitation = ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email=invited_user.email,
            message="Please join the project.",
            role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )

        preview_response = self.client.get(f"{self.respond_page_url}?token={token}")
        self.assertEqual(preview_response.status_code, status.HTTP_200_OK)
        self.assertContains(preview_response, "Accept Invitation")

        accept_response = self.client.post(
            self.respond_page_url,
            {"token": token, "action": "accept"},
            follow=True,
        )

        self.assertEqual(accept_response.status_code, status.HTTP_200_OK)
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, ProjectInvitation.STATUS_PENDING)
        self.assertFalse(ProjectMember.objects.filter(project=project, user=invited_user).exists())
        self.assertContains(accept_response, "Invitation action could not be completed.")
        self.assertContains(accept_response, "Accept Invitation")

    def test_invitation_response_page_accept_remains_pending_after_repeated_submit(self):
        project = Project.objects.create(name="Invite Project", description="Backend work", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        invited_user = User.objects.create_user(
            first_name="Musa",
            last_name="Arfah",
            email="musa@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        token = ProjectInvitationEmailService.generate_token()
        invitation = ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email=invited_user.email,
            message="Please join the project.",
            role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )

        first_response = self.client.post(
            self.respond_page_url,
            {"token": token, "action": "accept"},
            follow=True,
        )
        second_response = self.client.post(
            self.respond_page_url,
            {"token": token, "action": "accept"},
            follow=True,
        )

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, ProjectInvitation.STATUS_PENDING)
        self.assertFalse(ProjectMember.objects.filter(project=project, user=invited_user).exists())
        self.assertContains(second_response, "Invitation action could not be completed.")
        self.assertContains(second_response, "Accept Invitation")

    def test_invitation_response_page_rejects_invitation_end_to_end(self):
        project = Project.objects.create(name="Invite Project", description="", created_by=self.user)
        ProjectMember.objects.create(project=project, user=self.user, role=ProjectMember.ROLE_OWNER)
        token = ProjectInvitationEmailService.generate_token()
        invitation = ProjectInvitation.objects.create(
            project=project,
            invited_by=self.user,
            invited_email="reject-page@example.com",
            message="No thanks",
            role=ProjectMember.ROLE_MEMBER,
            token_hash=ProjectInvitationEmailService.hash_token(token),
            expires_at=ProjectInvitationEmailService.get_expiry(),
        )

        response = self.client.post(
            self.respond_page_url,
            {"token": token, "action": "reject"},
            follow=True,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, ProjectInvitation.STATUS_REJECTED)
        self.assertContains(response, "Invitation rejected successfully.")

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
