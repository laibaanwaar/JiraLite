
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import (
    NotFound,
    PermissionDenied,
)

from .models import (
    Project,
    ProjectInvitation,
    ProjectMember,
)
from .project_invitation_email_service import (
    InvitationEmailDeliveryError,
    send_project_invitation_email,
)


logger = logging.getLogger(__name__)

User = get_user_model()


class PerEmailInvitationError(Exception):
    """
    Error for one email inside a bulk invitation request.

    This prevents one invalid email from failing
    all other valid invitations.
    """
    pass


def _get_project_for_inviting(
    project_id,
    requesting_user,
):
    project = Project.objects.filter(
        pk=project_id
    ).first()

    if project is None:
        raise NotFound(
            "Project not found."
        )

    if project.status != Project.Status.ACTIVE:
        raise serializers.ValidationError(
            {
                "project": (
                    "Invitations can only be sent "
                    "for an active project."
                )
            }
        )

    is_admin = ProjectMember.objects.filter(
        project=project,
        user=requesting_user,
        role=ProjectMember.Role.ADMIN,
        status=ProjectMember.Status.ACTIVE,
    ).exists()

    if not is_admin:
        raise PermissionDenied(
            (
                "Only the Project Admin can "
                "invite users."
            )
        )

    return project


def _generate_unique_invitation_token():
    """
    Token collisions are extremely unlikely,
    but still explicitly handled.
    """

    for _ in range(5):
        token = secrets.token_urlsafe(32)

        exists = ProjectInvitation.objects.filter(
            token=token
        ).exists()

        if not exists:
            return token

    raise RuntimeError(
        "Unable to generate a unique invitation token."
    )


@transaction.atomic
def _create_single_invitation(
    project,
    requesting_user,
    email,
):
    # User must already exist in JiraLite.
    invited_user = (
        User.objects
        .select_for_update()
        .filter(
            email__iexact=email
        )
        .first()
    )

    if invited_user is None:
        raise PerEmailInvitationError(
            "No registered JiraLite user exists "
            "with this email."
        )

    # Account should be active and verified.
    if not invited_user.is_active:
        raise PerEmailInvitationError(
            "This user account is not active."
        )

    if not getattr(
        invited_user,
        "is_verified",
        True,
    ):
        raise PerEmailInvitationError(
            "This user's email is not verified."
        )

    # Admin cannot invite themselves.
    if invited_user.pk == requesting_user.pk:
        raise PerEmailInvitationError(
            "You cannot invite yourself."
        )

    # User cannot already have membership.
    existing_membership = (
        ProjectMember.objects
        .filter(
            project=project,
            user=invited_user,
        )
        .first()
    )

    if existing_membership:
        raise PerEmailInvitationError(
            "This user is already a project member."
        )

    # Check existing pending invitation.
    pending_invitation = (
        ProjectInvitation.objects
        .select_for_update()
        .filter(
            project=project,
            invited_user=invited_user,
            status=ProjectInvitation.Status.PENDING,
        )
        .first()
    )

    if pending_invitation:
        # Expired PENDING invitation should not block
        # creation of a fresh invitation.
        if pending_invitation.is_expired():
            pending_invitation.status = (
                ProjectInvitation.Status.EXPIRED
            )

            pending_invitation.responded_at = (
                timezone.now()
            )

            pending_invitation.save(
                update_fields=[
                    "status",
                    "responded_at",
                ]
            )

        else:
            raise PerEmailInvitationError(
                (
                    "A pending invitation already exists "
                    "for this user."
                )
            )

    expiry_hours = getattr(
        settings,
        "PROJECT_INVITATION_EXPIRY_HOURS",
        48,
    )

    invitation = ProjectInvitation.objects.create(
        project=project,
        invited_user=invited_user,
        invited_by=requesting_user,
        token=_generate_unique_invitation_token(),
        status=ProjectInvitation.Status.PENDING,
        expires_at=(
            timezone.now()
            + timedelta(hours=expiry_hours)
        ),
    )

    # If sending fails, transaction rolls back
    # and no unusable PENDING invitation remains.
    send_project_invitation_email(
        invitation
    )

    return invitation


def send_project_invitations(
    project_id,
    requesting_user,
    emails,
):
    """
    Process multiple emails independently.

    One invalid email does not prevent valid
    users from receiving invitations.
    """

    project = _get_project_for_inviting(
        project_id=project_id,
        requesting_user=requesting_user,
    )

    invited = []
    failed = []

    for email in emails:

        try:
            invitation = _create_single_invitation(
                project=project,
                requesting_user=requesting_user,
                email=email,
            )

            invited.append(
                {
                    "email": email,
                    "invitation_id": invitation.id,
                    "status": invitation.status,
                }
            )

        except PerEmailInvitationError as exc:
            failed.append(
                {
                    "email": email,
                    "reason": str(exc),
                }
            )

        except InvitationEmailDeliveryError:
            logger.exception(
                "Invitation email failed for %s",
                email,
            )

            failed.append(
                {
                    "email": email,
                    "reason": (
                        "Invitation email could not "
                        "be sent."
                    ),
                }
            )

        except IntegrityError:
            logger.exception(
                "Invitation integrity error for %s",
                email,
            )

            failed.append(
                {
                    "email": email,
                    "reason": (
                        "An invitation or membership "
                        "already exists."
                    ),
                }
            )

        except Exception:
            logger.exception(
                "Unexpected invitation error for %s",
                email,
            )

            failed.append(
                {
                    "email": email,
                    "reason": (
                        "Unable to process this invitation."
                    ),
                }
            )

    return {
        "invited": invited,
        "failed": failed,
    }


def get_user_invitations(user):
    """
    Return invitations belonging only
    to logged-in user.
    """

    # Convert stale PENDING invitations to EXPIRED.
    ProjectInvitation.objects.filter(
        invited_user=user,
        status=ProjectInvitation.Status.PENDING,
        expires_at__lte=timezone.now(),
    ).update(
        status=ProjectInvitation.Status.EXPIRED,
        responded_at=timezone.now(),
    )

    return (
        ProjectInvitation.objects
        .filter(
            invited_user=user
        )
        .select_related(
            "project",
            "invited_by",
            "invited_user",
        )
        .order_by("-created_at")
    )


def accept_project_invitation(
    token,
    requesting_user,
):
    expired = False

    with transaction.atomic():

        invitation = (
            ProjectInvitation.objects
            .select_for_update()
            .select_related(
                "project",
                "invited_user",
            )
            .filter(
                token=token
            )
            .first()
        )

        if invitation is None:
            raise NotFound(
                "Invitation not found."
            )

        # Token belongs only to invited user.
        if (
            invitation.invited_user_id
            != requesting_user.id
        ):
            raise PermissionDenied(
                (
                    "This invitation does not "
                    "belong to you."
                )
            )

        # Idempotency:
        # repeated accept should not create another membership.
        if (
            invitation.status
            == ProjectInvitation.Status.ACCEPTED
        ):
            membership = (
                ProjectMember.objects
                .filter(
                    project=invitation.project,
                    user=requesting_user,
                )
                .first()
            )

            return (
                invitation,
                membership,
                True,
            )

        if (
            invitation.status
            != ProjectInvitation.Status.PENDING
        ):
            raise serializers.ValidationError(
                {
                    "invitation": (
                        f"This invitation is already "
                        f"{invitation.status.lower()}."
                    )
                }
            )

        if invitation.is_expired():
            invitation.status = (
                ProjectInvitation.Status.EXPIRED
            )

            invitation.responded_at = timezone.now()

            invitation.save(
                update_fields=[
                    "status",
                    "responded_at",
                ]
            )

            expired = True

        else:
            if (
                invitation.project.status
                != Project.Status.ACTIVE
            ):
                raise serializers.ValidationError(
                    {
                        "project": (
                            "This project is not active."
                        )
                    }
                )

            membership, created = (
                ProjectMember.objects.get_or_create(
                    project=invitation.project,
                    user=requesting_user,
                    defaults={
                        "role": ProjectMember.Role.MEMBER,
                        "status": (
                            ProjectMember.Status.ACTIVE
                        ),
                    },
                )
            )

            # Handle legacy/race case where
            # membership exists but is inactive.
            if (
                not created
                and membership.status
                != ProjectMember.Status.ACTIVE
            ):
                membership.status = (
                    ProjectMember.Status.ACTIVE
                )

                membership.save(
                    update_fields=[
                        "status",
                    ]
                )

            invitation.status = (
                ProjectInvitation.Status.ACCEPTED
            )

            invitation.responded_at = timezone.now()

            invitation.save(
                update_fields=[
                    "status",
                    "responded_at",
                ]
            )

            return (
                invitation,
                membership,
                False,
            )

    # Raise outside atomic block,
    # so EXPIRED status remains committed.
    if expired:
        raise serializers.ValidationError(
            {
                "invitation": (
                    "This invitation has expired."
                )
            }
        )


def decline_project_invitation(
    token,
    requesting_user,
):
    expired = False

    with transaction.atomic():

        invitation = (
            ProjectInvitation.objects
            .select_for_update()
            .filter(
                token=token
            )
            .first()
        )

        if invitation is None:
            raise NotFound(
                "Invitation not found."
            )

        if (
            invitation.invited_user_id
            != requesting_user.id
        ):
            raise PermissionDenied(
                (
                    "This invitation does not "
                    "belong to you."
                )
            )

        # Idempotent decline.
        if (
            invitation.status
            == ProjectInvitation.Status.DECLINED
        ):
            return invitation, True

        if (
            invitation.status
            != ProjectInvitation.Status.PENDING
        ):
            raise serializers.ValidationError(
                {
                    "invitation": (
                        f"This invitation is already "
                        f"{invitation.status.lower()}."
                    )
                }
            )

        if invitation.is_expired():
            invitation.status = (
                ProjectInvitation.Status.EXPIRED
            )

            invitation.responded_at = timezone.now()

            invitation.save(
                update_fields=[
                    "status",
                    "responded_at",
                ]
            )

            expired = True

        else:
            invitation.status = (
                ProjectInvitation.Status.DECLINED
            )

            invitation.responded_at = timezone.now()

            invitation.save(
                update_fields=[
                    "status",
                    "responded_at",
                ]
            )

            return invitation, False

    if expired:
        raise serializers.ValidationError(
            {
                "invitation": (
                    "This invitation has expired."
                )
            }
        )


def cancel_project_invitation(
    invitation_id,
    requesting_user,
):
    expired = False

    with transaction.atomic():

        invitation = (
            ProjectInvitation.objects
            .select_for_update()
            .select_related(
                "project",
            )
            .filter(
                pk=invitation_id
            )
            .first()
        )

        if invitation is None:
            raise NotFound(
                "Invitation not found."
            )

        # Only project-specific ADMIN can cancel.
        is_admin = ProjectMember.objects.filter(
            project=invitation.project,
            user=requesting_user,
            role=ProjectMember.Role.ADMIN,
            status=ProjectMember.Status.ACTIVE,
        ).exists()

        if not is_admin:
            raise PermissionDenied(
                (
                    "Only the Project Admin can "
                    "cancel this invitation."
                )
            )

        # Idempotent cancellation.
        if (
            invitation.status
            == ProjectInvitation.Status.CANCELLED
        ):
            return invitation, True

        if (
            invitation.status
            != ProjectInvitation.Status.PENDING
        ):
            raise serializers.ValidationError(
                {
                    "invitation": (
                        "Only pending invitations "
                        "can be cancelled."
                    )
                }
            )

        if invitation.is_expired():
            invitation.status = (
                ProjectInvitation.Status.EXPIRED
            )

            invitation.responded_at = timezone.now()

            invitation.save(
                update_fields=[
                    "status",
                    "responded_at",
                ]
            )

            expired = True

        else:
            # Soft cancellation.
            # Do not physically delete invitation.
            invitation.status = (
                ProjectInvitation.Status.CANCELLED
            )

            invitation.responded_at = timezone.now()

            invitation.save(
                update_fields=[
                    "status",
                    "responded_at",
                ]
            )

            return invitation, False

    if expired:
        raise serializers.ValidationError(
            {
                "invitation": (
                    "The invitation has already expired."
                )
            }
        )
