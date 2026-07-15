import logging
from typing import Any, cast

from django.core.exceptions import ObjectDoesNotExist
from django.db import DatabaseError, OperationalError, transaction
from django.db.models import Count

from accounts.models.role import Role


logger = logging.getLogger(__name__)


class RoleService:
    """Handle role-related business logic."""

    @staticmethod
    def _build_role_payload(role: Any) -> dict:
        return {
            "id": role.id,
            "name": role.name,
            "code": role.code,
            "description": role.description,
            "is_active": role.is_active,
            "users_count": getattr(role, "users_count", 0),
            "created_at": role.created_at,
            "updated_at": role.updated_at,
        }

    @staticmethod
    def get_dashboard_stats() -> dict:
        try:
            total_roles = cast(Any, Role.objects).count()
            active_roles = cast(Any, Role.objects).filter(is_active=True).count()
            inactive_roles = cast(Any, Role.objects).filter(is_active=False).count()

            return {
                "success": True,
                "data": {
                    "total_roles": total_roles,
                    "active_roles": active_roles,
                    "inactive_roles": inactive_roles,
                },
            }
        except (DatabaseError, OperationalError):
            logger.exception("Database error while retrieving role dashboard stats.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
        except Exception:
            logger.exception("Unexpected error while retrieving role dashboard stats.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

    @staticmethod
    def get_all_roles() -> dict:
        try:
            roles = (
                cast(Any, Role.objects)
                .annotate(users_count=Count("users"))
                .order_by("name")
                .all()
            )

            return {
                "success": True,
                "message": "Roles retrieved successfully.",
                "data": list(roles),
            }
        except (DatabaseError, OperationalError):
            logger.exception("Database error while retrieving roles.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
        except Exception:
            logger.exception("Unexpected error while retrieving roles.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

    @staticmethod
    def get_role_by_id(role_id: int) -> dict:
        try:
            role = (
                cast(Any, Role.objects)
                .annotate(users_count=Count("users"))
                .get(pk=role_id)
            )

            return {
                "success": True,
                "message": "Role retrieved successfully.",
                "data": role,
            }
        except ObjectDoesNotExist:
            return {
                "success": False,
                "code": "role_not_found",
                "message": "Role not found.",
            }
        except (DatabaseError, OperationalError):
            logger.exception("Database error while retrieving role by ID.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
        except Exception:
            logger.exception("Unexpected error while retrieving role by ID.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

    @staticmethod
    def create_role(*, name: str, code: str, description: str = "", is_active: bool = True) -> dict:
        try:
            with cast(Any, transaction).atomic():
                if cast(Any, Role.objects).filter(name__iexact=name).exists():
                    return {
                        "success": False,
                        "code": "duplicate_role_name",
                        "message": "A role with this name already exists.",
                    }

                if cast(Any, Role.objects).filter(code__iexact=code).exists():
                    return {
                        "success": False,
                        "code": "duplicate_role_code",
                        "message": "A role with this code already exists.",
                    }

                role = cast(Any, Role.objects).create(
                    name=name,
                    code=code,
                    description=description,
                    is_active=is_active,
                )
                role = cast(Any, Role.objects).annotate(users_count=Count("users")).get(pk=role.id)

                return {
                    "success": True,
                    "message": "Role created successfully.",
                    "data": RoleService._build_role_payload(role),
                }
        except DatabaseError:
            logger.exception("Database error while creating role.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
        except Exception:
            logger.exception("Unexpected error while creating role.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

    @staticmethod
    def update_role(
        *,
        role_id: int,
        name: str | None = None,
        code: str | None = None,
        description: str | None = None,
        is_active: bool | None = None,
    ) -> dict:
        try:
            with cast(Any, transaction).atomic():
                try:
                    role = cast(Any, Role.objects).select_for_update().get(pk=role_id)
                except ObjectDoesNotExist:
                    return {
                        "success": False,
                        "code": "role_not_found",
                        "message": "Role not found.",
                    }

                if role.code == "admin":
                    if code is not None and code != "admin":
                        return {
                            "success": False,
                            "code": "system_role_protected",
                            "message": "The Admin role code cannot be changed.",
                        }

                    if is_active is False:
                        return {
                            "success": False,
                            "code": "system_role_protected",
                            "message": "The Admin role cannot be deactivated.",
                        }

                changed_fields = []

                if name is not None and name != role.name:
                    if cast(Any, Role.objects).filter(name__iexact=name).exclude(pk=role.id).exists():
                        return {
                            "success": False,
                            "code": "duplicate_role_name",
                            "message": "A role with this name already exists.",
                        }
                    role.name = name
                    changed_fields.append("name")

                if code is not None and code != role.code:
                    if cast(Any, Role.objects).filter(code__iexact=code).exclude(pk=role.id).exists():
                        return {
                            "success": False,
                            "code": "duplicate_role_code",
                            "message": "A role with this code already exists.",
                        }
                    role.code = code
                    changed_fields.append("code")

                if description is not None and description != role.description:
                    role.description = description
                    changed_fields.append("description")

                if is_active is not None and is_active != role.is_active:
                    role.is_active = is_active
                    changed_fields.append("is_active")

                if changed_fields:
                    changed_fields.append("updated_at")
                    role.save(update_fields=changed_fields)

                role = cast(Any, Role.objects).annotate(users_count=Count("users")).get(pk=role.id)

                return {
                    "success": True,
                    "message": "Role updated successfully.",
                    "data": RoleService._build_role_payload(role),
                }
        except DatabaseError:
            logger.exception("Database error while updating role.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
        except Exception:
            logger.exception("Unexpected error while updating role.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

    @staticmethod
    def deactivate_role(*, role_id: int) -> dict:
        try:
            with cast(Any, transaction).atomic():
                try:
                    role = cast(Any, Role.objects).select_for_update().get(pk=role_id)
                except ObjectDoesNotExist:
                    return {
                        "success": False,
                        "code": "role_not_found",
                        "message": "Role not found.",
                    }

                if not role.is_active:
                    return {
                        "success": False,
                        "code": "role_already_inactive",
                        "message": "Role is already inactive.",
                    }

                if role.code == "admin":
                    return {
                        "success": False,
                        "code": "system_role_protected",
                        "message": "The Admin role cannot be deactivated.",
                    }

                role.is_active = False
                role.save(update_fields=["is_active", "updated_at"])
                role = cast(Any, Role.objects).annotate(users_count=Count("users")).get(pk=role.id)

                return {
                    "success": True,
                    "message": "Role deactivated successfully.",
                    "data": RoleService._build_role_payload(role),
                }
        except (DatabaseError, OperationalError):
            logger.exception("Database error while deactivating role.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
        except Exception:
            logger.exception("Unexpected error while deactivating role.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
