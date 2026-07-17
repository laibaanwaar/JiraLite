from django.conf import settings
from django.db import models

from projects.models.task import Task


class TaskComment(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="task_comments",
    )
    content = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [
            models.Index(fields=["task", "created_at"], name="projects_tc_task_cr_9d2f9a_idx"),
            models.Index(fields=["author"], name="projects_tc_author_39fba5_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.task_id}:{self.author_id}"
