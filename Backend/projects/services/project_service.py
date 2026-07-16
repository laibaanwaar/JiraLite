import logging
from typing import Any, cast

from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import DatabaseError, IntegrityError, transaction
from django.utils import timezone

from accounts.services.exceptions import EmailDeliveryError
from projects.models import Project, ProjectInvitation, ProjectMember
from projects.services.email_service import ProjectInvitationEmailService


logger = logging.getLogger(__name__)


class ProjectService:
    @staticmethod
    def _normalize_invite_emails(*, invite_emails, owner_email: str) -> list[str]:
        if invite_emails in (None, ""):
            return []
        if not isinstance(invite_emails, list):
            raise ValidationError({"invite_emails": ["invite_emails must be a list."]})
        if len(invite_emails) > 20:
            raise ValidationError({"invite_emails": ["You can invite at most 20 emails at a time."]})

        unique_emails: list[str] = []
        seen = set()
        for raw_email in invite_emails:
            if not isinstance(raw_email, str):
                raise ValidationError({"invite_emails": ["Each invited email must be a string."]})
            normalized = raw_email.strip().lower()
            validate_email(normalized)
            if normalized == owner_email:
                raise ValidationError({"message": ["You cannot invite yourself to your own project."]})
            if normalized not in seen:
                seen.add(normalized)
                unique_emails.append(normalized)
        return unique_emails

    @staticmethod
    def _build_project_payload(project: Project, invitations: list[ProjectInvitation]) -> dict:
        invitation_items = [
            {
                "email": invitation.invited_email,
                "status": invitation.status,
                "email_status": invitation.email_status,
            }
            for invitation in invitations
        ]
        return {
            "project": {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "current_user_role": ProjectMember.ROLE_OWNER,
            },
            "invitation_count": len(invitation_items),
            "invited_emails": [item["email"] for item in invitation_items],
            "invitations": invitation_items,
        }

    @staticmethod
    def create_project(*, user, name: str, description: str = "", invite_emails=None, message: str = "") -> dict:
        normalized_owner_email = user.email.strip().lower()
        normalized_invite_emails = ProjectService._normalize_invite_emails(
            invite_emails=invite_emails,
            owner_email=normalized_owner_email,
        )

        raw_tokens_by_invitation_email: dict[str, str] = {}
        invitations: list[ProjectInvitation] = []

        with cast(Any, transaction).atomic():
            project = Project.objects.create(
                name=name.strip(),
                description=(description or "").strip(),
                created_by=user,
                is_active=True,
            )
            ProjectMember.objects.create(
                project=project,
                user=user,
                role=ProjectMember.ROLE_OWNER,
            )

            for invited_email in normalized_invite_emails:
                raw_token = ProjectInvitationEmailService.generate_token()
                token_hash = ProjectInvitationEmailService.hash_token(raw_token)
                invitation = ProjectInvitation.objects.create(
                    project=project,
                    invited_by=user,
                    invited_email=invited_email,
                    message=(message or "").strip(),
                    role=ProjectMember.ROLE_MEMBER,
                    token_hash=token_hash,
                    status=ProjectInvitation.STATUS_PENDING,
                    email_status=ProjectInvitation.EMAIL_PENDING,
                    expires_at=ProjectInvitationEmailService.get_expiry(),
                )
                raw_tokens_by_invitation_email[invited_email] = raw_token
                invitations.append(invitation)

        failed_invitations: list[str] = []
        inviter_name = f"{user.first_name} {user.last_name}".strip() or user.email
        for invitation in invitations:
            raw_token = raw_tokens_by_invitation_email[invitation.invited_email]
            try:
                ProjectInvitationEmailService.send_invitation_email(
                    invitation=invitation,
                    inviter_name=inviter_name,
                    project_name=project.name,
                    token=raw_token,
                )
            except EmailDeliveryError:
                invitation.email_status = ProjectInvitation.EMAIL_FAILED
                invitation.save(update_fields=["email_status", "updated_at"])
                failed_invitations.append(invitation.invited_email)
            else:
                invitation.email_status = ProjectInvitation.EMAIL_SENT
                invitation.save(update_fields=["email_status", "updated_at"])

        refreshed_invitations = list(ProjectInvitation.objects.filter(project=project).order_by("id"))
        if failed_invitations:
            return {
                "success": True,
                "message": "Project created, but some invitations could not be sent.",
                "data": {
                    **ProjectService._build_project_payload(project, refreshed_invitations),
                    "failed_invitations": failed_invitations,
                },
            }

        return {
            "success": True,
            "message": "Project created successfully.",
            "data": ProjectService._build_project_payload(project, refreshed_invitations),
        }

    @staticmethod
    def accept_invitation(*, user, token: str) -> dict:
        token_hash = ProjectInvitationEmailService.hash_token(token.strip())

        with cast(Any, transaction).atomic():
            try:
                invitation = cast(Any, ProjectInvitation.objects).select_for_update().select_related("project").get(
                    token_hash=token_hash
                )
            except ProjectInvitation.DoesNotExist as exc:
                raise ValidationError({"token": ["Invalid invitation token."]}) from exc

            if invitation.status != ProjectInvitation.STATUS_PENDING:
                raise ValidationError({"token": ["This invitation is no longer pending."]})

            if invitation.expires_at <= timezone.now():
                invitation.status = ProjectInvitation.STATUS_EXPIRED
                invitation.save(update_fields=["status", "updated_at"])
                raise ValidationError({"token": ["This invitation has expired."]})

            if invitation.invited_email != user.email.strip().lower():
                raise PermissionError("The logged-in email does not match the invited email.")

            if ProjectMember.objects.filter(project=invitation.project, user=user).exists():
                raise IntegrityError("User is already a project member.")

            membership = ProjectMember.objects.create(
                project=invitation.project,
                user=user,
                role=ProjectMember.ROLE_MEMBER,
            )
            invitation.status = ProjectInvitation.STATUS_ACCEPTED
            invitation.accepted_by = user
            invitation.accepted_at = timezone.now()
            invitation.save(update_fields=["status", "accepted_by", "accepted_at", "updated_at"])

        return {
            "success": True,
            "message": "Invitation accepted successfully.",
            "data": {
                "project_id": membership.project_id,
                "role": membership.role,
            },
        }
