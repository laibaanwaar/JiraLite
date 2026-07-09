import logging
from typing import Any, cast

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.db import DatabaseError, IntegrityError, OperationalError, transaction

from accounts.models.role import Role


logger = logging.getLogger(__name__)

User = get_user_model()


class UserService:
    """Handle user management business logic."""

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
                    "data": {
                        "id": user.id,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "email": user.email,
                        "is_active": user.is_active,
                        "role": {
                            "id": role.id,
                            "name": role.name,
                            "code": role.code,
                        },
                        "date_joined": user.date_joined,
                    },
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
                },
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