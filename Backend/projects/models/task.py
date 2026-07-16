from django.conf import settings
from django.db import models

from projects.models.project import Project
from projects.models.project_member import ProjectMember


class Task(models.Model):
    PRIORITY_LOW = "LOW"
    PRIORITY_MEDIUM = "MEDIUM"
    PRIORITY_HIGH = "HIGH"
    PRIORITY_URGENT = "URGENT"
    PRIORITY_CHOICES = (
        (PRIORITY_LOW, "Low"),
        (PRIORITY_MEDIUM, "Medium"),
        (PRIORITY_HIGH, "High"),
        (PRIORITY_URGENT, "Urgent"),
    )

    STATUS_TO_DO = "TO_DO"
    STATUS_IN_PROGRESS = "IN_PROGRESS"
    STATUS_IN_REVIEW = "IN_REVIEW"
    STATUS_DONE = "DONE"
    STATUS_CHOICES = (
        (STATUS_TO_DO, "To Do"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_IN_REVIEW, "In Review"),
        (STATUS_DONE, "Done"),
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, max_length=5000)
    assignee = models.ForeignKey(
        ProjectMember,
        on_delete=models.PROTECT,
        related_name="assigned_tasks",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_tasks",
    )
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_TO_DO)
    due_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["project"], name="projects_ta_project_2a28eb_idx"),
            models.Index(fields=["assignee"], name="projects_ta_assigne_17bc7e_idx"),
            models.Index(fields=["status"], name="projects_ta_status_fc176d_idx"),
            models.Index(fields=["priority"], name="projects_ta_priorit_692086_idx"),
            models.Index(fields=["due_date"], name="projects_ta_due_dat_50c3c8_idx"),
            models.Index(fields=["created_at"], name="projects_ta_created_9380f1_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.project_id}:{self.title}"
