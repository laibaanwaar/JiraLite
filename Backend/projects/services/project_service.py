import logging
from typing import Any, cast

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.db import DatabaseError, IntegrityError, OperationalError, transaction
from django.db.models import Q

from projects.models.project import Project


logger = logging.getLogger(__name__)
User = get_user_model()


class ProjectService:
    @staticmethod
    def _build_project_payload(project: Any) -> dict:
        return {
            "id": project.id,
            "name": project.name,
            "key": project.key,
            "description": project.description,
            "is_archived": project.is_archived,
            "owner_id": project.owner_id,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
        }

    @staticmethod
    def _build_project_list_payload(project: Any) -> dict:
        owner = project.owner
        owner_role = owner.role

        return {
            "id": project.id,
            "name": project.name,
            "key": project.key,
            "description": project.description,
            "is_archived": project.is_archived,
            "owner_id": project.owner_id,
            "owner": {
                "id": owner.id,
                "first_name": owner.first_name,
                "last_name": owner.last_name,
                "email": owner.email,
                "is_active": owner.is_active,
                "role": {
                    "id": owner_role.id,
                    "name": owner_role.name,
                    "code": owner_role.code,
                    "is_active": owner_role.is_active,
                },
            },
            "created_at": project.created_at,
            "updated_at": project.updated_at,
        }

    @staticmethod
    def create_project(*, name: str, key: str, description: str = "", owner_id: int) -> dict:
        try:
            with cast(Any, transaction).atomic():
                if cast(Any, Project.objects).filter(name__iexact=name).exists():
                    return {
                        "success": False,
                        "code": "duplicate_project_name",
                        "message": "A project with this name already exists.",
                    }

                if cast(Any, Project.objects).filter(key__iexact=key).exists():
                    return {
                        "success": False,
                        "code": "duplicate_project_key",
                        "message": "A project with this key already exists.",
                    }

                try:
                    owner = cast(Any, User.objects).select_for_update().get(pk=owner_id)
                except ObjectDoesNotExist:
                    return {
                        "success": False,
                        "code": "owner_not_found",
                        "message": "Owner not found.",
                    }

                if not owner.is_active:
                    return {
                        "success": False,
                        "code": "owner_inactive",
                        "message": "The selected owner is inactive.",
                    }

                project = cast(Any, Project.objects).create(
                    name=name,
                    key=key,
                    description=description,
                    owner=owner,
                )

                return {
                    "success": True,
                    "message": "Project created successfully.",
                    "data": ProjectService._build_project_payload(project),
                }
        except IntegrityError:
            logger.warning("Project uniqueness race condition caught during project creation.")
            return {
                "success": False,
                "code": "duplicate_project",
                "message": "A project with this name or key already exists.",
            }
        except (DatabaseError, OperationalError):
            logger.exception("Database error while creating project.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
        except Exception:
            logger.exception("Unexpected error while creating project.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

    @staticmethod
    def get_all_projects(
        *,
        search: str = "",
        filter_field: str = "",
        filter_value: str = "",
        sort_by: str = "name",
        offset: int = 0,
        limit: int = 10,
    ) -> dict:
        allowed_sort_fields = {
            "name": "name",
            "key": "key",
            "created_at": "created_at",
            "updated_at": "updated_at",
            "owner_email": "owner__email",
            "owner_first_name": "owner__first_name",
            "owner_last_name": "owner__last_name",
        }
        allowed_filter_fields = {
            "owner_id": "owner_id",
            "owner_email": "owner__email",
            "owner_role_code": "owner__role__code",
            "owner_is_active": "owner__is_active",
        }

        try:
            limit_value = int(limit)
            offset_value = int(offset)
        except (TypeError, ValueError):
            return {
                "success": False,
                "code": "invalid_limit_offset",
                "message": "Invalid limit or offset parameter.",
            }

        if limit_value < 1 or limit_value > 100:
            return {
                "success": False,
                "code": "invalid_limit_offset",
                "message": "Limit must be between 1 and 100.",
            }

        if offset_value < 0:
            return {
                "success": False,
                "code": "invalid_limit_offset",
                "message": "Offset must be non-negative.",
            }

        sort_value = (sort_by or "name").strip().lower()
        sort_direction = ""
        if sort_value.startswith("-"):
            sort_direction = "-"
            sort_value = sort_value[1:]

        sort_field = allowed_sort_fields.get(sort_value)
        if sort_field is None:
            return {
                "success": False,
                "code": "invalid_sort",
                "message": "Invalid sort parameter.",
            }

        filter_key = (filter_field or "").strip().lower()
        filter_column = None
        if filter_key:
            filter_column = allowed_filter_fields.get(filter_key)
            if filter_column is None:
                return {
                    "success": False,
                    "code": "invalid_filter",
                    "message": "Invalid filter parameter.",
                }

            if not str(filter_value).strip():
                return {
                    "success": False,
                    "code": "invalid_filter_value",
                    "message": "Invalid filter value.",
                }

        try:
            queryset = cast(Any, Project.objects).select_related("owner", "owner__role").all()

            search_term = (search or "").strip()
            if search_term:
                queryset = queryset.filter(
                    Q(name__icontains=search_term)
                    | Q(key__icontains=search_term)
                    | Q(description__icontains=search_term)
                    | Q(owner__email__icontains=search_term)
                    | Q(owner__first_name__icontains=search_term)
                    | Q(owner__last_name__icontains=search_term)
                )

            if filter_column == "owner_id":
                try:
                    owner_id = int(filter_value)
                except (TypeError, ValueError):
                    return {
                        "success": False,
                        "code": "invalid_filter_value",
                        "message": "Invalid filter value.",
                    }

                if owner_id <= 0:
                    return {
                        "success": False,
                        "code": "invalid_filter_value",
                        "message": "Invalid filter value.",
                    }

                queryset = queryset.filter(owner_id=owner_id)
            elif filter_column == "owner__email":
                queryset = queryset.filter(owner__email__iexact=str(filter_value).strip())
            elif filter_column == "owner__role__code":
                queryset = queryset.filter(owner__role__code=str(filter_value).strip().lower())
            elif filter_column == "owner__is_active":
                normalized = str(filter_value).strip().lower()
                if normalized not in {"true", "false", "1", "0", "yes", "no"}:
                    return {
                        "success": False,
                        "code": "invalid_filter_value",
                        "message": "Invalid filter value.",
                    }
                queryset = queryset.filter(owner__is_active=normalized in {"true", "1", "yes"})

            queryset = queryset.order_by(f"{sort_direction}{sort_field}")

            total_count = queryset.count()
            projects = queryset[offset_value : offset_value + limit_value]

            return {
                "success": True,
                "message": "Projects retrieved successfully.",
                "data": [
                    ProjectService._build_project_list_payload(project)
                    for project in projects
                ],
                "pagination": {
                    "total_count": total_count,
                    "limit": limit_value,
                    "offset": offset_value,
                },
            }
        except (DatabaseError, OperationalError):
            logger.exception("Database error while retrieving projects.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
        except Exception:
            logger.exception("Unexpected error while retrieving projects.")
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

    @staticmethod
    def get_project_by_id(project_id: int) -> dict:
        try:
            project_value = int(project_id)
        except (TypeError, ValueError):
            return {
                "success": False,
                "code": "invalid_project_id",
                "message": "Invalid project ID.",
            }

        if project_value <= 0:
            return {
                "success": False,
                "code": "invalid_project_id",
                "message": "Invalid project ID.",
            }

        try:
            project = cast(Any, Project.objects).select_related("owner", "owner__role").get(pk=project_value)
        except ObjectDoesNotExist:
            return {
                "success": False,
                "code": "project_not_found",
                "message": "Project not found.",
            }
        except (DatabaseError, OperationalError):
            logger.exception("Database error while retrieving project %s.", project_value)
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
        except Exception:
            logger.exception("Unexpected error while retrieving project %s.", project_value)
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

        return {
            "success": True,
            "message": "Project retrieved successfully.",
            "data": ProjectService._build_project_list_payload(project),
        }

    @staticmethod
    def archive_project(project_id: int) -> dict:
        try:
            project_value = int(project_id)
        except (TypeError, ValueError):
            return {
                "success": False,
                "code": "invalid_project_id",
                "message": "Invalid project ID.",
            }

        if project_value <= 0:
            return {
                "success": False,
                "code": "invalid_project_id",
                "message": "Invalid project ID.",
            }

        try:
            with cast(Any, transaction).atomic():
                try:
                    project = (
                        cast(Any, Project.objects)
                        .select_for_update()
                        .select_related("owner", "owner__role")
                        .get(pk=project_value)
                    )
                except ObjectDoesNotExist:
                    return {
                        "success": False,
                        "code": "project_not_found",
                        "message": "Project not found.",
                    }

                if project.is_archived:
                    return {
                        "success": False,
                        "code": "project_archived",
                        "message": "Project is already archived.",
                    }

                project.is_archived = True
                project.save(update_fields=["is_archived", "updated_at"])

                return {
                    "success": True,
                    "message": "Project archived successfully.",
                    "data": ProjectService._build_project_list_payload(project),
                }
        except (DatabaseError, OperationalError):
            logger.exception("Database error while archiving project %s.", project_value)
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
        except Exception:
            logger.exception("Unexpected error while archiving project %s.", project_value)
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

    @staticmethod
    def update_project(
        *,
        project_id: int,
        name: str | None = None,
        key: str | None = None,
        description: str | None = None,
        owner_id: int | None = None,
    ) -> dict:
        try:
            project_value = int(project_id)
        except (TypeError, ValueError):
            return {
                "success": False,
                "code": "invalid_project_id",
                "message": "Invalid project ID.",
            }

        if project_value <= 0:
            return {
                "success": False,
                "code": "invalid_project_id",
                "message": "Invalid project ID.",
            }

        try:
            with cast(Any, transaction).atomic():
                try:
                    project = (
                        cast(Any, Project.objects)
                        .select_for_update()
                        .select_related("owner", "owner__role")
                        .get(pk=project_value)
                    )
                except ObjectDoesNotExist:
                    return {
                        "success": False,
                        "code": "project_not_found",
                        "message": "Project not found.",
                    }

                if project.is_archived:
                    return {
                        "success": False,
                        "code": "project_archived",
                        "message": "Archived projects cannot be modified.",
                    }

                if name is not None and cast(Any, Project.objects).filter(
                    name__iexact=name
                ).exclude(pk=project.pk).exists():
                    return {
                        "success": False,
                        "code": "duplicate_project_name",
                        "message": "A project with this name already exists.",
                    }

                if key is not None and cast(Any, Project.objects).filter(
                    key__iexact=key
                ).exclude(pk=project.pk).exists():
                    return {
                        "success": False,
                        "code": "duplicate_project_key",
                        "message": "A project with this key already exists.",
                    }

                if owner_id is not None:
                    try:
                        owner = cast(Any, User.objects).select_for_update().get(pk=owner_id)
                    except ObjectDoesNotExist:
                        return {
                            "success": False,
                            "code": "owner_not_found",
                            "message": "Owner not found.",
                        }

                    if not owner.is_active:
                        return {
                            "success": False,
                            "code": "owner_inactive",
                            "message": "The selected owner is inactive.",
                        }

                    project.owner = owner

                if name is not None:
                    project.name = name

                if key is not None:
                    project.key = key

                if description is not None:
                    project.description = description

                project.save()

                return {
                    "success": True,
                    "message": "Project updated successfully.",
                    "data": ProjectService._build_project_list_payload(project),
                }
        except IntegrityError:
            logger.warning("Project uniqueness race condition caught during project update.")
            return {
                "success": False,
                "code": "duplicate_project",
                "message": "A project with this name or key already exists.",
            }
        except (DatabaseError, OperationalError):
            logger.exception("Database error while updating project %s.", project_value)
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
        except Exception:
            logger.exception("Unexpected error while updating project %s.", project_value)
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
