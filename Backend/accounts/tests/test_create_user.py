from typing import Any, cast
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models.role import Role


User = get_user_model()


class CreateUserApiTests(APITestCase):
    """Tests for POST /api/users/"""

    def setUp(self):
        self.admin_role = Role.objects.create(
            name="Admin",
            code="admin",
            description="Administrator role",
        )
        self.engineer_role = Role.objects.create(
            name="Engineer",
            code="engineer",
            description="Engineer role",
        )
        self.admin_user = cast(Any, User.objects).create_user(
            email="admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            last_name="User",
            role=self.admin_role,
        )
        self.url = reverse("user-create")

    def _auth(self, user=None):
        """Attach a valid JWT access token for the given user."""
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def _payload(self, **overrides):
        """Return a valid base payload with optional field overrides."""
        base = {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane@example.com",
            "password": "SecurePass1!",
            "role_id": self.engineer_role.id,
        }
        base.update(overrides)
        return base

    # ------------------------------------------------------------------ #
    # Success                                                              #
    # ------------------------------------------------------------------ #

    def test_create_user_success(self):
        """Admin creates a user → 201 with user data, no password in response."""
        self._auth()
        response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data["data"])
        self.assertEqual(response.data["data"]["email"], "jane@example.com")
        self.assertNotIn("password", response.data["data"])

    def test_email_is_stored_lowercase(self):
        """Email is normalised to lowercase before saving."""
        self._auth()
        response = self.client.post(
            self.url, self._payload(email="JANE@EXAMPLE.COM"), format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["email"], "jane@example.com")

    # ------------------------------------------------------------------ #
    # Authentication / Authorization                                       #
    # ------------------------------------------------------------------ #

    def test_unauthenticated_request_rejected(self):
        """No token → 401."""
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_role_rejected(self):
        """Authenticated engineer cannot create users → 403."""
        engineer_user = cast(Any, User.objects).create_user(
            email="eng@example.com",
            password="Pass123!",
            first_name="Eng",
            last_name="User",
            role=self.engineer_role,
        )
        self._auth(engineer_user)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_inactive_user_rejected(self):
        """Inactive admin cannot use the API → 401."""
        self.admin_user.is_active = False
        self.admin_user.save(update_fields=["is_active"])
        self._auth()
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------------------------------------ #
    # Duplicate Email                                                      #
    # ------------------------------------------------------------------ #

    def test_duplicate_email_rejected(self):
        """Exact duplicate email → 409."""
        self._auth()
        self.client.post(self.url, self._payload(), format="json")
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_duplicate_email_case_insensitive(self):
        """Uppercase variant of existing email → 409."""
        self._auth()
        self.client.post(self.url, self._payload(email="jane@example.com"), format="json")
        response = self.client.post(
            self.url, self._payload(email="JANE@EXAMPLE.COM"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_email_with_leading_trailing_spaces_normalised(self):
        """Email with surrounding spaces is trimmed and still treated as duplicate."""
        self._auth()
        self.client.post(self.url, self._payload(email="jane@example.com"), format="json")
        response = self.client.post(
            self.url, self._payload(email="  jane@example.com  "), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    # ------------------------------------------------------------------ #
    # Required Fields                                                      #
    # ------------------------------------------------------------------ #

    def test_missing_email_rejected(self):
        self._auth()
        payload = self._payload()
        del payload["email"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_password_rejected(self):
        self._auth()
        payload = self._payload()
        del payload["password"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_first_name_rejected(self):
        self._auth()
        payload = self._payload()
        del payload["first_name"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_last_name_rejected(self):
        self._auth()
        payload = self._payload()
        del payload["last_name"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_role_id_rejected(self):
        self._auth()
        payload = self._payload()
        del payload["role_id"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------ #
    # Empty / Blank Strings                                                #
    # ------------------------------------------------------------------ #

    def test_empty_first_name_rejected(self):
        self._auth()
        response = self.client.post(self.url, self._payload(first_name="  "), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_last_name_rejected(self):
        self._auth()
        response = self.client.post(self.url, self._payload(last_name=""), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_email_rejected(self):
        self._auth()
        response = self.client.post(self.url, self._payload(email=""), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------ #
    # Invalid Email Format                                                 #
    # ------------------------------------------------------------------ #

    def test_invalid_email_format_rejected(self):
        self._auth()
        response = self.client.post(self.url, self._payload(email="not-an-email"), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------ #
    # Password Edge Cases                                                  #
    # ------------------------------------------------------------------ #

    def test_whitespace_only_password_rejected(self):
        self._auth()
        response = self.client.post(self.url, self._payload(password="        "), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_short_password_rejected(self):
        self._auth()
        response = self.client.post(self.url, self._payload(password="Ab1!"), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_without_digit_rejected(self):
        self._auth()
        response = self.client.post(
            self.url, self._payload(password="NoDigitsHere!"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_without_letter_rejected(self):
        self._auth()
        response = self.client.post(self.url, self._payload(password="12345678"), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------ #
    # Role Edge Cases                                                      #
    # ------------------------------------------------------------------ #

    def test_nonexistent_role_rejected(self):
        """role_id that does not exist → 404."""
        self._auth()
        response = self.client.post(self.url, self._payload(role_id=9999), format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_null_role_rejected(self):
        """Null role_id → 400 (serializer level)."""
        self._auth()
        response = self.client.post(self.url, self._payload(role_id=None), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_role_rejected(self):
        """Inactive role → 400."""
        self.engineer_role.is_active = False
        self.engineer_role.save(update_fields=["is_active"])
        self._auth()
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------ #
    # Invalid JSON Body                                                    #
    # ------------------------------------------------------------------ #

    def test_invalid_json_body_rejected(self):
        """Non-JSON body → 400."""
        self._auth()
        response = self.client.post(
            self.url, "not json", content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
