from django.conf import settings
from django.db import models

from projects.models.task import Task


class TaskStatusHistory(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="status_history",
    )
    old_status = models.CharField(max_length=20, choices=Task.STATUS_CHOICES)
    new_status = models.CharField(max_length=20, choices=Task.STATUS_CHOICES)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="task_status_changes",
    )
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-changed_at", "-id"]
        indexes = [
            models.Index(fields=["task", "changed_at"], name="projects_tsh_task_chg_idx"),
            models.Index(fields=["changed_by"], name="projects_tsh_user_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.task_id}:{self.old_status}->{self.new_status}"
