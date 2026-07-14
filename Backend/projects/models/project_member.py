from django.conf import settings
from django.db import models

from projects.models.project import Project


class ProjectMember(models.Model):
    """Stores project membership assignments."""

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="members",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["project_id", "user_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "user"],
                name="unique_project_member_assignment",
            )
        ]

    def __str__(self) -> str:
        return f"{self.project_id}:{self.user_id}"
