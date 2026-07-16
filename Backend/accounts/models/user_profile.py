from django.conf import settings
from django.db import models


def profile_image_upload_path(instance, filename: str) -> str:
    return f"profile-images/user-{instance.user_id}/{filename}"


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    profile_image = models.FileField(
        upload_to=profile_image_upload_path,
        null=True,
        blank=True,
    )
    phone = models.CharField(max_length=20, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user_id"]

    def __str__(self) -> str:
        return f"profile:{self.user_id}"
