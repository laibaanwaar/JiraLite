from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q


class Project(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        COMPLETED = "COMPLETED", "Completed"
        ARCHIVED = "ARCHIVED", "Archived"

    name = models.CharField(
        max_length=200,
    )

    project_key = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
    )

    description = models.TextField(
        blank=True,
        default="",
    )

    # One user can create many projects.
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_projects",
    )

    start_date = models.DateField(
        null=True,
        blank=True,
    )

    end_date = models.DateField(
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(start_date__isnull=True)
                    | Q(end_date__isnull=True)
                    | Q(end_date__gte=F("start_date"))
                ),
                name="project_valid_date_range",
            ),
        ]

    def clean(self):
        super().clean()

        if self.name:
            self.name = self.name.strip()

        if not self.name:
            raise ValidationError(
                {
                    "name": "Project name cannot be empty."
                }
            )

        if self.project_key:
            self.project_key = (
                self.project_key
                .strip()
                .upper()
            )

        if not self.project_key:
            raise ValidationError(
                {
                    "project_key": "Project key is required."
                }
            )

        if (
            self.start_date
            and self.end_date
            and self.end_date < self.start_date
        ):
            raise ValidationError(
                {
                    "end_date": (
                        "End date cannot be before start date."
                    )
                }
            )

    def save(self, *args, **kwargs):
        if self.name:
            self.name = self.name.strip()

        if self.project_key:
            self.project_key = (
                self.project_key
                .strip()
                .upper()
            )

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.project_key} - {self.name}"


class ProjectMember(models.Model):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        MEMBER = "MEMBER", "Member"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="project_members",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_memberships",
    )

    # Project-specific role.
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.MEMBER,
        db_index=True,
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )

    joined_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["joined_at"]

        constraints = [
            # Same user cannot join same project twice.
            models.UniqueConstraint(
                fields=[
                    "project",
                    "user",
                ],
                name="unique_project_member",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "project",
                    "user",
                    "role",
                    "status",
                ],
                name="project_member_lookup_idx",
            ),
        ]

    def __str__(self):
        return (
            f"{self.user.email} - "
            f"{self.project.project_key} - "
            f"{self.role}"
        )


from .project_invitation_model import ProjectInvitation  # noqa: E402, F401
