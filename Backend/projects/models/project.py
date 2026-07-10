from django.conf import settings
from django.db import models


class Project(models.Model):
    """Stores project records."""

    name = models.CharField(max_length=150, unique=True)
    key = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    is_archived = models.BooleanField(default=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="owned_projects",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
