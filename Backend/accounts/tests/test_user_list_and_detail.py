from typing import Any, cast
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models.role import Role


User = get_user_model()


class UserListApiTests(APITestCase):

    def setUp(self):
        self.admin_role = Role.objects.create(
            name="Admin",
            code="admin",
            description="Administrator role",
            is_active=True,
        )
        self.engineer_role = Role.objects.create(
            name="Engineer",
            code="engineer",
            description="Engineer role",
            is_active=True,
        )
        self.task_manager_role = Role.objects.create(
            name="Task Manager",
            code="task_manager",
            description="Task Manager role",
            is_active=True,
        )
        self.inactive_role = Role.objects.create(
            name="Inactive Role",
            code="inactive",
            description="Inactive role for testing",
            is_active=False,
        )

        self.admin_user = cast(Any, User.objects).create_user(
            email="admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            last_name="User",
            role=self.admin_role,
            is_active=True,
        )

        self.engineer1 = cast(Any, User.objects).create_user(
            email="engineer1@example.com",
            password="EngPass123!",
            first_name="Alice",
            last_name="Engineer",
            role=self.engineer_role,
            is_active=True,
        )
        self.engineer2 = cast(Any, User.objects).create_user(
            email="engineer2@example.com",
            password="EngPass123!",
            first_name="Bob",
            last_name="Developer",
            role=self.engineer_role,
            is_active=True,
        )

        self.inactive_user = cast(Any, User.objects).create_user(
            email="inactive@example.com",
            password="InactivePass123!",
            first_name="Inactive",
            last_name="User",
            role=self.engineer_role,
            is_active=False,
        )

        self.task_manager = cast(Any, User.objects).create_user(
            email="taskmanager@example.com",
            password="TMPass123!",
            first_name="Charlie",
            last_name="Manager",
            role=self.task_manager_role,
            is_active=True,
        )

        self.url = reverse("user-list")

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def test_list_users_success(self):
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("data", response.data)
        self.assertIn("pagination", response.data)
        self.assertEqual(len(response.data["data"]), 5)  # 5 users created

    def test_list_users_does_not_expose_password(self):
        """Password field is never returned in user list."""
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for user_data in response.data["data"]:
            self.assertNotIn("password", user_data)

    def test_list_users_includes_role_object(self):
        """Role is serialized as object, not just ID."""
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = response.data["data"][0]
        self.assertIn("role", user)
        self.assertIn("id", user["role"])
        self.assertIn("name", user["role"])
        self.assertIn("code", user["role"])
        self.assertIn("is_active", user["role"])

    def test_list_users_includes_safe_fields(self):
        """Response includes expected safe user fields."""
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = response.data["data"][0]
        required_fields = ["id", "email", "first_name", "last_name", "is_active", "role", "date_joined", "created_at"]
        for field in required_fields:
            self.assertIn(field, user)

    def test_list_users_default_pagination(self):
        """Default pagination limit is 10, offset is 0."""
        self._auth()
        response = self.client.get(self.url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["pagination"]["limit"], 10)
        self.assertEqual(response.data["pagination"]["offset"], 0)
        self.assertEqual(response.data["pagination"]["total_count"], 5)

    def test_list_users_custom_limit(self):
        """Custom limit parameter works."""
        self._auth()
        response = self.client.get(f"{self.url}?limit=2", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["pagination"]["limit"], 2)
        self.assertEqual(len(response.data["data"]), 2)

    def test_list_users_custom_offset(self):
        """Custom offset parameter works."""
        self._auth()
        response = self.client.get(f"{self.url}?offset=2&limit=2", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["pagination"]["offset"], 2)
        self.assertEqual(len(response.data["data"]), 2)

    def test_list_users_sort_by_email(self):
        """Sort by email works (default)."""
        self._auth()
        response = self.client.get(f"{self.url}?sort=email", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [u["email"] for u in response.data["data"]]
        self.assertEqual(emails, sorted(emails))

    def test_list_users_sort_by_first_name(self):
        """Sort by first_name works."""
        self._auth()
        response = self.client.get(f"{self.url}?sort=first_name", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [u["first_name"] for u in response.data["data"]]
        self.assertEqual(names, sorted(names))

    def test_list_users_sort_by_last_name(self):
        """Sort by last_name works."""
        self._auth()
        response = self.client.get(f"{self.url}?sort=last_name", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [u["last_name"] for u in response.data["data"]]
        self.assertEqual(names, sorted(names))

    def test_list_users_search_by_email(self):
        """Search by email substring."""
        self._auth()
        response = self.client.get(f"{self.url}?search=engineer1", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["email"], "engineer1@example.com")

    def test_list_users_search_by_first_name(self):
        """Search by first_name substring."""
        self._auth()
        response = self.client.get(f"{self.url}?search=Alice", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["first_name"], "Alice")

    def test_list_users_search_by_last_name(self):
        """Search by last_name substring."""
        self._auth()
        response = self.client.get(f"{self.url}?search=Manager", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["last_name"], "Manager")

    def test_list_users_search_case_insensitive(self):
        """Search is case-insensitive."""
        self._auth()
        response = self.client.get(f"{self.url}?search=ALICE", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)

    def test_list_users_search_no_match(self):
        """Search with no match returns empty list."""
        self._auth()
        response = self.client.get(f"{self.url}?search=nonexistent", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 0)

    def test_list_users_filter_by_is_active_true(self):
        """Filter by is_active=true returns only active users."""
        self._auth()
        response = self.client.get(f"{self.url}?filter=is_active&filter_value=true", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 4)  # 5 - 1 inactive
        for user in response.data["data"]:
            self.assertTrue(user["is_active"])

    def test_list_users_filter_by_is_active_false(self):
        """Filter by is_active=false returns only inactive users."""
        self._auth()
        response = self.client.get(f"{self.url}?filter=is_active&filter_value=false", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertFalse(response.data["data"][0]["is_active"])

    def test_list_users_filter_by_role_code(self):
        """Filter by role_code works."""
        self._auth()
        response = self.client.get(f"{self.url}?filter=role_code&filter_value=engineer", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 2)  # 2 engineers (1 active, 1 inactive)

    def test_list_users_filter_role_code_case_insensitive(self):
        """Role code filter is case-insensitive."""
        self._auth()
        response = self.client.get(f"{self.url}?filter=role_code&filter_value=ENGINEER", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 2)

    # ------------------------------------------------------------------ #
    # Pagination Edge Cases                                                #
    # ------------------------------------------------------------------ #

    def test_list_users_limit_too_large(self):
        """Limit > 100 → 400."""
        self._auth()
        response = self.client.get(f"{self.url}?limit=101", format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_users_limit_zero(self):
        """Limit = 0 → 400."""
        self._auth()
        response = self.client.get(f"{self.url}?limit=0", format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_users_limit_negative(self):
        """Limit < 0 → 400."""
        self._auth()
        response = self.client.get(f"{self.url}?limit=-1", format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_users_offset_negative(self):
        """Offset < 0 → 400."""
        self._auth()
        response = self.client.get(f"{self.url}?offset=-1", format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_users_invalid_limit_type(self):
        """Non-integer limit → 400."""
        self._auth()
        response = self.client.get(f"{self.url}?limit=abc", format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_users_invalid_offset_type(self):
        """Non-integer offset → 400."""
        self._auth()
        response = self.client.get(f"{self.url}?offset=xyz", format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------ #
    # Authentication / Authorization                                       #
    # ------------------------------------------------------------------ #

    def test_list_users_unauthenticated_rejected(self):
        """No token → 401."""
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_users_non_admin_rejected(self):
        """Engineer cannot list users → 403."""
        self._auth(self.engineer1)
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_users_task_manager_rejected(self):
        """Task Manager cannot list users → 403."""
        self._auth(self.task_manager)
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_users_inactive_admin_rejected(self):
        """Inactive admin cannot list users → 401."""
        self.admin_user.is_active = False
        self.admin_user.save(update_fields=["is_active"])
        self._auth()
        response = self.client.get(self.url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------------------------------------ #
    # Empty Results                                                        #
    # ------------------------------------------------------------------ #

    def test_list_users_empty_search_result(self):
        """Search returning no results still returns 200 with empty list."""
        self._auth()
        response = self.client.get(f"{self.url}?search=xyz123", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 0)
        self.assertEqual(response.data["pagination"]["total_count"], 0)


class UserDetailApiTests(APITestCase):
    """Tests for GET /api/users/{id}/"""

    def setUp(self):
        """Set up test fixtures."""
        self.admin_role = Role.objects.create(
            name="Admin",
            code="admin",
            description="Administrator role",
            is_active=True,
        )
        self.engineer_role = Role.objects.create(
            name="Engineer",
            code="engineer",
            description="Engineer role",
            is_active=True,
        )

        self.admin_user = cast(Any, User.objects).create_user(
            email="admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            last_name="User",
            role=self.admin_role,
            is_active=True,
        )

        self.engineer_user = cast(Any, User.objects).create_user(
            email="engineer@example.com",
            password="EngPass123!",
            first_name="Engineer",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )

    def _auth(self, user=None):
        """Attach a valid JWT access token for the given user."""
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def _get_url(self, user_id):
        """Build URL for user detail endpoint."""
        return reverse("user-detail", kwargs={"user_id": user_id})

    # ------------------------------------------------------------------ #
    # Success Cases                                                        #
    # ------------------------------------------------------------------ #

    def test_get_user_detail_success(self):
        """Admin retrieves user detail → 200."""
        self._auth()
        url = self._get_url(self.engineer_user.id)
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("data", response.data)
        self.assertEqual(response.data["data"]["id"], self.engineer_user.id)
        self.assertEqual(response.data["data"]["email"], "engineer@example.com")

    def test_get_user_detail_does_not_expose_password(self):
        """Password field is never returned."""
        self._auth()
        url = self._get_url(self.engineer_user.id)
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("password", response.data["data"])

    def test_get_user_detail_includes_role_object(self):
        """Role is serialized as object."""
        self._auth()
        url = self._get_url(self.engineer_user.id)
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = response.data["data"]
        self.assertIn("role", user)
        self.assertIn("id", user["role"])
        self.assertIn("name", user["role"])
        self.assertIn("code", user["role"])
        self.assertEqual(user["role"]["code"], "engineer")

    def test_get_user_detail_includes_timestamps(self):
        """Response includes date_joined, created_at, updated_at."""
        self._auth()
        url = self._get_url(self.engineer_user.id)
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = response.data["data"]
        self.assertIn("date_joined", user)
        self.assertIn("created_at", user)
        self.assertIn("updated_at", user)

    # ------------------------------------------------------------------ #
    # Invalid ID Cases                                                     #
    # ------------------------------------------------------------------ #

    def test_get_user_detail_nonexistent_id(self):
        """Nonexistent user ID → 404."""
        self._auth()
        url = self._get_url(9999)
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("message", response.data)

    def test_get_user_detail_invalid_id_string(self):
        """Non-numeric user ID → 400."""
        self._auth()
        url = self._get_url("invalid")
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_user_detail_zero_id(self):
        """User ID = 0 → 400."""
        self._auth()
        url = self._get_url(0)
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_user_detail_negative_id(self):
        """Negative user ID → 400."""
        self._auth()
        url = self._get_url(-1)
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------ #
    # Authentication / Authorization                                       #
    # ------------------------------------------------------------------ #

    def test_get_user_detail_unauthenticated_rejected(self):
        """No token → 401."""
        url = self._get_url(self.engineer_user.id)
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_user_detail_non_admin_rejected(self):
        """Engineer cannot get user detail → 403."""
        self._auth(self.engineer_user)
        url = self._get_url(self.admin_user.id)
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_user_detail_inactive_admin_rejected(self):
        """Inactive admin cannot get user detail → 401."""
        self.admin_user.is_active = False
        self.admin_user.save(update_fields=["is_active"])
        self._auth()
        url = self._get_url(self.engineer_user.id)
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------------------------------------ #
    # Inactive Users / Roles                                               #
    # ------------------------------------------------------------------ #

    def test_get_inactive_user_succeeds(self):
        """Admin can retrieve inactive user data."""
        inactive_user = cast(Any, User.objects).create_user(
            email="inactive@example.com",
            password="InactivePass123!",
            first_name="Inactive",
            last_name="User",
            role=self.engineer_role,
            is_active=False,
        )
        self._auth()
        url = self._get_url(inactive_user.id)
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["data"]["is_active"])

    def test_get_user_with_inactive_role(self):
        """User with inactive role is still retrievable."""
        inactive_role = Role.objects.create(
            name="Inactive",
            code="inactive",
            is_active=False,
        )
        user_with_inactive_role = cast(Any, User.objects).create_user(
            email="user_inactive_role@example.com",
            password="Pass123!",
            first_name="User",
            last_name="Name",
            role=inactive_role,
            is_active=True,
        )
        self._auth()
        url = self._get_url(user_with_inactive_role.id)
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["data"]["role"]["is_active"])


class UserDetailUpdateApiTests(APITestCase):
    """Tests for PATCH /api/users/{id}/"""

    def setUp(self):
        self.admin_role = Role.objects.create(
            name="Admin",
            code="admin",
            description="Administrator role",
            is_active=True,
        )
        self.engineer_role = Role.objects.create(
            name="Engineer",
            code="engineer",
            description="Engineer role",
            is_active=True,
        )
        self.task_manager_role = Role.objects.create(
            name="Task Manager",
            code="task_manager",
            description="Task Manager role",
            is_active=True,
        )
        self.inactive_role = Role.objects.create(
            name="Inactive",
            code="inactive",
            description="Inactive role",
            is_active=False,
        )

        self.admin_user = cast(Any, User.objects).create_user(
            email="admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            last_name="User",
            role=self.admin_role,
            is_active=True,
        )
        self.engineer_user = cast(Any, User.objects).create_user(
            email="engineer@example.com",
            password="EngPass123!",
            first_name="Engineer",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self.other_user = cast(Any, User.objects).create_user(
            email="other@example.com",
            password="OtherPass123!",
            first_name="Other",
            last_name="User",
            role=self.task_manager_role,
            is_active=True,
        )

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def _get_url(self, user_id):
        return reverse("user-detail", kwargs={"user_id": user_id})

    def _payload(self, **overrides):
        base = {
            "first_name": "Updated",
            "last_name": "Name",
            "email": "updated@example.com",
            "role_id": self.task_manager_role.id,
        }
        base.update(overrides)
        return base

    def test_patch_user_detail_success(self):
        self._auth()
        url = self._get_url(self.engineer_user.id)
        response = self.client.patch(url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["first_name"], "Updated")
        self.assertEqual(response.data["data"]["email"], "updated@example.com")
        self.assertEqual(response.data["data"]["role"]["code"], "task_manager")

    def test_patch_user_detail_allows_partial_update(self):
        self._auth()
        url = self._get_url(self.engineer_user.id)
        response = self.client.patch(url, {"first_name": "Partial"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["first_name"], "Partial")
        self.assertEqual(response.data["data"]["last_name"], "User")

    def test_patch_user_detail_empty_payload_rejected(self):
        self._auth()
        url = self._get_url(self.engineer_user.id)
        response = self.client.patch(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Validation failed.")
        self.assertIn("errors", response.data)

    def test_patch_user_detail_password_field_rejected(self):
        self._auth()
        url = self._get_url(self.engineer_user.id)
        response = self.client.patch(
            url,
            {"password": "NewPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Validation failed.")
        self.assertIn("password", response.data["errors"])

    def test_patch_user_detail_invalid_email_rejected(self):
        self._auth()
        url = self._get_url(self.engineer_user.id)
        response = self.client.patch(url, {"email": "not-an-email"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Validation failed.")

    def test_patch_user_detail_duplicate_email_rejected(self):
        self._auth()
        url = self._get_url(self.engineer_user.id)
        response = self.client.patch(
            url,
            {"email": self.admin_user.email},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["message"], "Email already exists.")

    def test_patch_user_detail_role_not_found(self):
        self._auth()
        url = self._get_url(self.engineer_user.id)
        response = self.client.patch(url, {"role_id": 9999}, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["message"], "Invalid role.")

    def test_patch_user_detail_inactive_role_rejected(self):
        self._auth()
        url = self._get_url(self.engineer_user.id)
        response = self.client.patch(
            url,
            {"role_id": self.inactive_role.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Role is inactive.")

    def test_admin_cannot_remove_own_admin_role(self):
        self._auth()
        url = self._get_url(self.admin_user.id)
        response = self.client.patch(
            url,
            {"role_id": self.engineer_role.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.admin_user.refresh_from_db()
        self.assertEqual(self.admin_user.role.code, "admin")

    def test_patch_user_detail_invalid_user_id_zero(self):
        self._auth()
        url = self._get_url(0)
        response = self.client.patch(url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_user_detail_invalid_user_id_negative(self):
        self._auth()
        url = self._get_url(-1)
        response = self.client.patch(url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_user_detail_nonexistent_id(self):
        self._auth()
        url = self._get_url(9999)
        response = self.client.patch(url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_user_detail_unauthenticated_rejected(self):
        url = self._get_url(self.engineer_user.id)
        response = self.client.patch(url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["message"], "Unauthorized.")

    def test_patch_user_detail_non_admin_rejected(self):
        self._auth(self.other_user)
        url = self._get_url(self.engineer_user.id)
        response = self.client.patch(url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "Permission denied.")


class UserDeactivateApiTests(APITestCase):
    """Tests for PATCH /api/users/{id}/deactivate/"""

    def setUp(self):
        self.admin_role = Role.objects.create(
            name="Admin",
            code="admin",
            description="Administrator role",
            is_active=True,
        )
        self.engineer_role = Role.objects.create(
            name="Engineer",
            code="engineer",
            description="Engineer role",
            is_active=True,
        )
        self.task_manager_role = Role.objects.create(
            name="Task Manager",
            code="task_manager",
            description="Task Manager role",
            is_active=True,
        )

        self.admin_user = cast(Any, User.objects).create_user(
            email="admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            last_name="User",
            role=self.admin_role,
            is_active=True,
        )
        self.second_admin = cast(Any, User.objects).create_user(
            email="admin2@example.com",
            password="AdminPass123!",
            first_name="Second",
            last_name="Admin",
            role=self.admin_role,
            is_active=True,
        )
        self.engineer_user = cast(Any, User.objects).create_user(
            email="engineer@example.com",
            password="EngPass123!",
            first_name="Engineer",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self.inactive_user = cast(Any, User.objects).create_user(
            email="inactive@example.com",
            password="InactivePass123!",
            first_name="Inactive",
            last_name="User",
            role=self.task_manager_role,
            is_active=False,
        )

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def _get_url(self, user_id):
        return reverse("user-deactivate", kwargs={"user_id": user_id})

    def test_deactivate_user_success(self):
        self._auth(self.second_admin)
        refresh_token = str(RefreshToken.for_user(self.engineer_user))
        url = self._get_url(self.engineer_user.id)

        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.engineer_user.refresh_from_db()
        self.assertFalse(self.engineer_user.is_active)

        refresh_response = self.client.post(
            reverse("auth-refresh"),
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_deactivate_user_missing_token_rejected(self):
        url = self._get_url(self.engineer_user.id)
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_deactivate_user_invalid_access_token_rejected(self):
        url = self._get_url(self.engineer_user.id)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer not-a-valid-token")
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_deactivate_user_expired_access_token_rejected(self):
        url = self._get_url(self.engineer_user.id)
        token = RefreshToken.for_user(self.admin_user).access_token
        token["exp"] = 1
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")

        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_deactivate_user_non_admin_rejected(self):
        self._auth(self.engineer_user)
        url = self._get_url(self.admin_user.id)
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_deactivate_user_invalid_id_string(self):
        self._auth()
        url = self._get_url("invalid")
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deactivate_user_invalid_id_negative(self):
        self._auth()
        url = self._get_url(-1)
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deactivate_user_not_found(self):
        self._auth()
        url = self._get_url(9999)
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_deactivate_user_already_inactive(self):
        self._auth()
        url = self._get_url(self.inactive_user.id)
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_deactivate_user_self_deactivation_blocked(self):
        self._auth(self.admin_user)
        url = self._get_url(self.admin_user.id)
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.admin_user.refresh_from_db()
        self.assertTrue(self.admin_user.is_active)


class UserActivateApiTests(APITestCase):
    """Tests for PATCH /api/users/{id}/activate/"""

    def setUp(self):
        self.admin_role = Role.objects.create(
            name="Admin",
            code="admin",
            description="Administrator role",
            is_active=True,
        )
        self.engineer_role = Role.objects.create(
            name="Engineer",
            code="engineer",
            description="Engineer role",
            is_active=True,
        )

        self.admin_user = cast(Any, User.objects).create_user(
            email="admin@example.com",
            password="AdminPass123!",
            first_name="Admin",
            last_name="User",
            role=self.admin_role,
            is_active=True,
        )
        self.active_user = cast(Any, User.objects).create_user(
            email="active@example.com",
            password="ActivePass123!",
            first_name="Active",
            last_name="User",
            role=self.engineer_role,
            is_active=True,
        )
        self.inactive_user = cast(Any, User.objects).create_user(
            email="inactive@example.com",
            password="InactivePass123!",
            first_name="Inactive",
            last_name="User",
            role=self.engineer_role,
            is_active=False,
        )

    def _auth(self, user=None):
        target = user or self.admin_user
        refresh = RefreshToken.for_user(target)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def _get_url(self, user_id):
        return reverse("user-activate", kwargs={"user_id": user_id})

    def test_activate_user_success(self):
        self._auth()
        url = self._get_url(self.inactive_user.id)
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "User activated successfully.")
        self.inactive_user.refresh_from_db()
        self.assertTrue(self.inactive_user.is_active)

    def test_activate_user_missing_token_rejected(self):
        url = self._get_url(self.inactive_user.id)
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_activate_user_non_admin_rejected(self):
        self._auth(self.active_user)
        url = self._get_url(self.inactive_user.id)
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_activate_user_invalid_id_rejected(self):
        self._auth()
        url = self._get_url("invalid")
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_activate_user_not_found(self):
        self._auth()
        url = self._get_url(9999)
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_activate_user_already_active(self):
        self._auth()
        url = self._get_url(self.active_user.id)
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_deactivate_last_active_admin_blocked(self):
        self.second_admin.is_active = False
        self.second_admin.save(update_fields=["is_active"])
        self._auth()
        url = self._get_url(self.admin_user.id)
        response = self.client.patch(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.admin_user.refresh_from_db()
        self.assertTrue(self.admin_user.is_active)
