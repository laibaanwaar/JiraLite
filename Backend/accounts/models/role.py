from django.db import models


class Role(models.Model):
    CODE_ADMIN = "ADMIN"
    CODE_MEMBER = "MEMBER"
    CODE_CHOICES = (
        (CODE_ADMIN, "Admin"),
        (CODE_MEMBER, "Member"),
    )

    code = models.CharField(max_length=20, unique=True, choices=CODE_CHOICES)
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.code}:{self.name}"
