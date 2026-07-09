import logging
from typing import Any, Optional, cast

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.db import DatabaseError, IntegrityError, OperationalError, transaction
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from accounts.models.role import Role


logger = logging.getLogger(__name__)

User = get_user_model()


class UserService:
    """Handle user management business logic."""

    @staticmethod
    def _build_user_payload(
        user: Any,
        *,
        include_role_is_active: bool = True,
        include_created_at: bool = True,
        include_updated_at: bool = True,
    ) -> dict:
        role_data = {
            "id": user.role.id,
            "name": user.role.name,
            "code": user.role.code,
        }
        if include_role_is_active:
            role_data["is_active"] = user.role.is_active

        payload = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "role": role_data,
            "date_joined": user.date_joined,
        }
        if include_created_at:
            payload["created_at"] = user.created_at
        if include_updated_at:
            payload["updated_at"] = user.updated_at
        return payload

    @staticmethod
    def create_user(
        *,
        first_name: str,
        last_name: str,
        email: str,
        password: str,
        role_id: int,
    ) -> dict:
        """
        Create a new user account.

        Validates role existence and activity, checks for duplicate email,
        hashes the password, and persists the new user inside a transaction.
        """
        try:
            with cast(Any, transaction).atomic():
                # Verify role exists.
                try:
                    role = cast(Any, Role.objects).get(pk=role_id)
                except ObjectDoesNotExist:
                    return {
                        "success": False,
                        "code": "role_not_found",
                        "message": "Role not found.",
                    }

                # Verify role is active.
                if not role.is_active:
                    return {
                        "success": False,
                        "code": "role_inactive",
                        "message": "The selected role is inactive.",
                    }

                # Check for duplicate email (case-insensitive, already lowercased by serializer).
                if User.objects.filter(email=email).exists():
                    return {
                        "success": False,
                        "code": "duplicate_email",
                        "message": "A user with this email already exists.",
                    }

                # Create the user; create_user() hashes the password internally.
                user = cast(Any, User.objects).create_user(
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    role=role,
                    is_active=True,
                )

                return {
                    "success": True,
                    "message": "User created successfully.",
                    "data": UserService._build_user_payload(
                        user,
                        include_role_is_active=False,
                        include_created_at=False,
                        include_updated_at=False,
                    ),
                }

        except IntegrityError:
            # Handles a race condition where two requests create the same email simultaneously.
            logger.warning("Duplicate email race condition caught during user creation.")
            return {
                "success": False,
                "code": "duplicate_email",
                "message": "A user with this email already exists.",
            }

        except (DatabaseError, OperationalError):
            logger.exception("Database error during user creation.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

        except Exception:
            logger.exception("Unexpected error during user creation.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
    @staticmethod
    def get_all_users(
        *,
        search: str = "",
        filter_field: str = "",
        filter_value: str = "",
        sort_by: str = "email",
        offset: int = 0,
        limit: int = 10,
    ) -> dict:
        try:
            queryset = cast(Any, User.objects).select_related("role").all()

            if search and search.strip():
                search_term = search.strip()
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(email__icontains=search_term)
                    | Q(first_name__icontains=search_term)
                    | Q(last_name__icontains=search_term)
                )

            if filter_field and filter_value:
                if filter_field == "is_active":
                    is_active_val = filter_value.lower() in ("true", "1", "yes")
                    queryset = queryset.filter(is_active=is_active_val)
                elif filter_field == "role_code":
                    queryset = queryset.filter(role__code=filter_value.lower())

            if sort_by in ("email", "first_name", "last_name", "date_joined"):
                queryset = queryset.order_by(sort_by)
            else:
                queryset = queryset.order_by("email")

            total_count = queryset.count()
            users = queryset[offset : offset + limit]

            users_data = []
            for user in users:
                users_data.append(
                    {
                        "id": user.id,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "is_active": user.is_active,
                        "role": {
                            "id": user.role.id,
                            "name": user.role.name,
                            "code": user.role.code,
                            "is_active": user.role.is_active,
                        },
                        "date_joined": user.date_joined,
                        "created_at": user.created_at,
                    }
                )

            return {
                "success": True,
                "message": "Users retrieved successfully.",
                "data": users_data,
                "pagination": {
                    "total_count": total_count,
                    "limit": limit,
                    "offset": offset,
                },
            }

        except (DatabaseError, OperationalError):
            logger.exception("Database error while retrieving users.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

        except Exception:
            logger.exception("Unexpected error while retrieving users.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

    @staticmethod
    def get_user_by_id(user_id: int) -> dict:
        try:
            user = cast(Any, User.objects).select_related("role").get(pk=user_id)

            return {
                "success": True,
                "message": "User retrieved successfully.",
                "data": UserService._build_user_payload(user),
            }

        except ObjectDoesNotExist:
            return {
                "success": False,
                "code": "user_not_found",
                "message": "User not found.",
            }

        except (DatabaseError, OperationalError):
            logger.exception("Database error while retrieving user by ID.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

        except Exception:
            logger.exception("Unexpected error while retrieving user by ID.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

    @staticmethod
    def update_user(
        *,
        user_id: int,
        actor_user: Optional[Any] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        email: Optional[str] = None,
        role_id: Optional[int] = None,
    ) -> dict:
        """Update an existing user account."""
        try:
            with cast(Any, transaction).atomic():
                try:
                    user = cast(Any, User.objects).select_related("role").get(pk=user_id)
                except ObjectDoesNotExist:
                    return {
                        "success": False,
                        "code": "user_not_found",
                        "message": "User not found.",
                    }

                role = None
                if role_id is not None:
                    try:
                        role = cast(Any, Role.objects).get(pk=role_id)
                    except ObjectDoesNotExist:
                        return {
                            "success": False,
                            "code": "role_not_found",
                            "message": "Role not found.",
                        }

                    if not role.is_active:
                        return {
                            "success": False,
                            "code": "role_inactive",
                            "message": "The selected role is inactive.",
                        }

                    if (
                        actor_user is not None
                        and getattr(actor_user, "id", None) == user.id
                        and getattr(getattr(actor_user, "role", None), "code", None) == "admin"
                        and role.code != "admin"
                    ):
                        return {
                            "success": False,
                            "code": "admin_role_change_not_allowed",
                            "message": "Admins cannot remove their own Admin role.",
                        }

                if email is not None:
                    if User.objects.filter(email__iexact=email).exclude(pk=user.id).exists():
                        return {
                            "success": False,
                            "code": "duplicate_email",
                            "message": "A user with this email already exists.",
                        }
                    user.email = email

                if first_name is not None:
                    user.first_name = first_name

                if last_name is not None:
                    user.last_name = last_name

                if role is not None:
                    user.role = role

                changed_fields = []
                if first_name is not None:
                    changed_fields.append("first_name")
                if last_name is not None:
                    changed_fields.append("last_name")
                if email is not None:
                    changed_fields.append("email")
                if role is not None:
                    changed_fields.append("role")

                if changed_fields:
                    changed_fields.append("updated_at")
                    user.save(update_fields=changed_fields)

                user.refresh_from_db()

                return {
                    "success": True,
                    "message": "User updated successfully.",
                    "data": UserService._build_user_payload(user),
                }

        except IntegrityError:
            logger.warning("Duplicate email race condition caught during user update.")
            return {
                "success": False,
                "code": "duplicate_email",
                "message": "A user with this email already exists.",
            }

        except (DatabaseError, OperationalError):
            logger.exception("Database error during user update.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

        except Exception:
            logger.exception("Unexpected error during user update.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

    @staticmethod
    def deactivate_user(*, user_id: int, actor_user: Any) -> dict:
        """Soft deactivate a user account and revoke its refresh tokens."""
        try:
            with cast(Any, transaction).atomic():
                user = cast(Any, User.objects).select_related("role").select_for_update().get(pk=user_id)

                if not user.is_active:
                    return {
                        "success": False,
                        "code": "user_already_inactive",
                        "message": "User is already inactive.",
                    }

                if getattr(actor_user, "id", None) == user.id:
                    return {
                        "success": False,
                        "code": "self_deactivation_not_allowed",
                        "message": "You cannot deactivate your own account.",
                    }

                if getattr(user, "role", None) and user.role.code == "admin":
                    other_active_admins = (
                        cast(Any, User.objects)
                        .filter(is_active=True, role__code="admin")
                        .exclude(pk=user.id)
                        .exists()
                    )

                    if not other_active_admins:
                        return {
                            "success": False,
                            "code": "last_active_admin",
                            "message": "At least one active Admin must remain in the system.",
                        }

                user.is_active = False
                user.save(update_fields=["is_active", "updated_at"])

                revoked_tokens = 0
                for outstanding_token in OutstandingToken.objects.filter(user_id=user.id):
                    _, created = BlacklistedToken.objects.get_or_create(token=outstanding_token)
                    if created:
                        revoked_tokens += 1

                user.refresh_from_db()

                return {
                    "success": True,
                    "message": "User deactivated successfully.",
                    "data": {
                        "id": user.id,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "is_active": user.is_active,
                        "role": {
                            "id": user.role.id,
                            "name": user.role.name,
                            "code": user.role.code,
                            "is_active": user.role.is_active,
                        },
                        "date_joined": user.date_joined,
                        "created_at": user.created_at,
                        "updated_at": user.updated_at,
                        "revoked_refresh_tokens": revoked_tokens,
                    },
                }

        except ObjectDoesNotExist:
            return {
                "success": False,
                "code": "user_not_found",
                "message": "User not found.",
            }

        except IntegrityError:
            logger.exception("Integrity error during user deactivation.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

        except (DatabaseError, OperationalError):
            logger.exception("Database error during user deactivation.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

        except Exception:
            logger.exception("Unexpected error during user deactivation.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
