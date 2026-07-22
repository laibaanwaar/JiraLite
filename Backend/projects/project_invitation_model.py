from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone


class ProjectInvitation(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        DECLINED = "DECLINED", "Declined"
        CANCELLED = "CANCELLED", "Cancelled"
        EXPIRED = "EXPIRED", "Expired"

    # Project being invited to
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="invitations",
    )

    # Existing registered JiraLite user receiving invitation
    invited_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_project_invitations",
    )

    # Project Admin sending invitation
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="sent_project_invitations",
    )

    # Secure token used for accept/decline
    token = models.CharField(
        max_length=128,
        unique=True,
        db_index=True,
        editable=False,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    expires_at = models.DateTimeField(
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    responded_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            # Only one active PENDING invitation
            # for same user + same project.
            models.UniqueConstraint(
                fields=[
                    "project",
                    "invited_user",
                ],
                condition=Q(status="PENDING"),
                name="unique_pending_project_invitation",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "invited_user",
                    "status",
                ],
                name="invited_user_status_idx",
            ),
        ]

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return (
            f"{self.invited_user.email} -> "
            f"{self.project.name} ({self.status})"
        )