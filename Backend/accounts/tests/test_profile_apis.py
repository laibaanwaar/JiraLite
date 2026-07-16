import base64
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import DatabaseError
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.settings import api_settings

from accounts.models import UserProfile


User = get_user_model()

PNG_IMAGE_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn0n1wAAAAASUVORK5CYII="
)


class ProfileApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            first_name="Sara",
            last_name="Ahmed",
            email="profile@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
        self.profile_url = reverse("profile-detail")
        self.avatar_delete_url = reverse("profile-avatar-delete")

    def test_get_profile_creates_missing_profile(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(UserProfile.objects.filter(user=self.user).exists())
        self.assertIn("profile", response.data["data"])
        self.assertEqual(response.data["data"]["full_name"], "Sara Ahmed")
        self.assertNotIn("password", response.data["data"])

    def test_get_profile_requires_authentication(self):
        self.client.credentials()
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_profile_requires_authentication(self):
        self.client.credentials()
        response = self.client.patch(self.profile_url, {"bio": "Hello"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_profile_rejects_invalid_token(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_profile_rejects_invalid_token(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
        response = self.client.patch(self.profile_url, {"bio": "Hello"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_profile_rejects_expired_token(self):
        refresh = RefreshToken.for_user(self.user)
        access = refresh.access_token
        access.set_exp(lifetime=-api_settings.ACCESS_TOKEN_LIFETIME)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(access)}")
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_profile_rejects_inactive_user(self):
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_profile_rejects_inactive_user(self):
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])
        response = self.client.patch(self.profile_url, {"bio": "Hello"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_profile_existing_profile(self):
        UserProfile.objects.create(user=self.user, phone="+92 300", bio="Hello")
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["profile"]["phone"], "+92 300")

    def test_get_profile_handles_database_error(self):
        with patch(
            "accounts.services.profile_service.ProfileService.get_profile_payload",
            side_effect=DatabaseError("db"),
        ):
            response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_patch_profile_partial_update_json(self):
        response = self.client.patch(
            self.profile_url,
            {
                "first_name": "  Sarah ",
                "phone": " +92 300-1234567 ",
                "bio": "  Product builder. ",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Sarah")
        self.assertEqual(self.user.profile.phone, "+92 300-1234567")
        self.assertEqual(self.user.profile.bio, "Product builder.")
        self.assertNotIn("password", response.data["data"])
        self.assertNotIn("date_joined", response.data["data"])
        self.assertNotIn("created_at", response.data["data"])
        self.assertNotIn("updated_at", response.data["data"])

    def test_patch_profile_updates_all_allowed_fields(self):
        response = self.client.patch(
            self.profile_url,
            {
                "first_name": "Sara",
                "last_name": "Awan",
                "phone": "+92 300 1234567",
                "bio": "Backend developer working on JiraLite.",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Sara")
        self.assertEqual(self.user.last_name, "Awan")
        self.assertEqual(self.user.profile.phone, "+92 300 1234567")
        self.assertEqual(self.user.profile.bio, "Backend developer working on JiraLite.")

    def test_patch_profile_rejects_blank_name(self):
        response = self.client.patch(self.profile_url, {"first_name": "   "}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_profile_rejects_blank_last_name(self):
        response = self.client.patch(self.profile_url, {"last_name": "   "}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_profile_rejects_invalid_phone(self):
        response = self.client.patch(self.profile_url, {"phone": "abc123"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_profile_rejects_long_bio(self):
        response = self.client.patch(self.profile_url, {"bio": "a" * 501}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_profile_rejects_email_change(self):
        original_email = self.user.email
        response = self.client.patch(
            self.profile_url,
            {"email": "new@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, original_email)

    def test_patch_profile_rejects_password_change(self):
        original_password = self.user.password
        response = self.client.patch(
            self.profile_url,
            {"password": "AnotherPassword@123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertEqual(self.user.password, original_password)

    def test_patch_profile_rejects_restricted_fields(self):
        response = self.client.patch(
            self.profile_url,
            {"user_id": 999, "is_superuser": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("user_id", response.data["errors"])
        self.assertIn("is_superuser", response.data["errors"])

    def test_patch_profile_rejects_unknown_fields(self):
        response = self.client.patch(
            self.profile_url,
            {"nickname": "builder"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("nickname", response.data["errors"])

    def test_patch_profile_creates_missing_profile_for_old_user(self):
        response = self.client.patch(
            self.profile_url,
            {"bio": "Updated profile description."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(UserProfile.objects.filter(user=self.user).exists())
        self.assertEqual(response.data["data"]["profile"]["bio"], "Updated profile description.")

    def test_user_cannot_update_another_users_profile(self):
        other_user = User.objects.create_user(
            first_name="Ali",
            last_name="Khan",
            email="other@example.com",
            password="UserPassword@123",
            is_email_verified=True,
            is_active=True,
        )
        UserProfile.objects.create(user=other_user, phone="+1 555 0000", bio="Other profile")

        response = self.client.patch(
            self.profile_url,
            {"user_id": other_user.id, "bio": "Hijack attempt"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        other_user.refresh_from_db()
        self.user.refresh_from_db()
        self.assertEqual(other_user.profile.bio, "Other profile")
        self.assertFalse(UserProfile.objects.filter(user=self.user).exists())

    def test_patch_profile_updates_image(self):
        response = self.client.patch(
            self.profile_url,
            {
                "profile_image": SimpleUploadedFile(
                    "avatar.png",
                    PNG_IMAGE_BYTES,
                    content_type="image/png",
                )
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(bool(self.user.profile.profile_image))

    def test_patch_profile_rejects_invalid_image_type(self):
        response = self.client.patch(
            self.profile_url,
            {
                "profile_image": SimpleUploadedFile(
                    "avatar.gif",
                    b"gif-content",
                    content_type="image/gif",
                )
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_profile_rejects_damaged_image(self):
        response = self.client.patch(
            self.profile_url,
            {
                "profile_image": SimpleUploadedFile(
                    "avatar.png",
                    b"not-a-real-image",
                    content_type="image/png",
                )
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_profile_rejects_oversized_image(self):
        response = self.client.patch(
            self.profile_url,
            {
                "profile_image": SimpleUploadedFile(
                    "avatar.png",
                    b"\x89PNG\r\n\x1a\n" + (b"a" * (5 * 1024 * 1024)),
                    content_type="image/png",
                )
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_avatar_success(self):
        self.client.patch(
            self.profile_url,
            {
                "profile_image": SimpleUploadedFile(
                    "avatar.png",
                    PNG_IMAGE_BYTES,
                    content_type="image/png",
                )
            },
            format="multipart",
        )
        response = self.client.delete(self.avatar_delete_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(bool(self.user.profile.profile_image))

    def test_profile_update_handles_unexpected_error(self):
        with patch(
            "accounts.services.profile_service.ProfileService.update_profile",
            side_effect=Exception("unexpected"),
        ):
            response = self.client.patch(
                self.profile_url,
                {"bio": "Hello"},
                format="json",
            )
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    @override_settings(MEDIA_ROOT="D:/JiraLite/Backend/.tmp-test-media")
    def test_profile_update_rolls_back_when_update_fails(self):
        with patch(
            "accounts.models.user_profile.UserProfile.save",
            side_effect=DatabaseError("db write failed"),
        ):
            response = self.client.patch(
                self.profile_url,
                {"first_name": "Changed", "bio": "Should rollback"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Sara")
        self.assertFalse(UserProfile.objects.filter(user=self.user).exists())
