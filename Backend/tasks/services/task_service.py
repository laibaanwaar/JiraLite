import logging
from typing import Any, cast

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.db import DatabaseError, IntegrityError, OperationalError, transaction
from django.db.models import Q

from projects.models.project import Project
from projects.models.project_member import ProjectMember
from tasks.models.task import Task


logger = logging.getLogger(__name__)
User = get_user_model()


class TaskService:
    @staticmethod
    def _build_role_payload(role: Any) -> dict:
        return {
            "id": role.id,
            "name": role.name,
            "code": role.code,
            "is_active": role.is_active,
        }

    @staticmethod
    def _build_user_payload(user: Any) -> dict:
        return {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "is_active": user.is_active,
            "role": TaskService._build_role_payload(user.role),
        }

    @staticmethod
    def _build_project_payload(project: Any) -> dict:
        return {
            "id": project.id,
            "name": project.name,
            "key": project.key,
            "description": project.description,
            "is_archived": project.is_archived,
            "owner_id": project.owner_id,
            "owner": TaskService._build_user_payload(project.owner),
            "created_at": project.created_at,
            "updated_at": project.updated_at,
        }

    @staticmethod
    def _build_task_payload(task: Any) -> dict:
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "priority": task.priority,
            "status": task.status,
            "due_date": task.due_date,
            "project_id": task.project_id,
            "assigned_to_id": task.assigned_to_id,
            "project": TaskService._build_project_payload(task.project),
            "assigned_to": TaskService._build_user_payload(task.assigned_to),
            "created_by": TaskService._build_user_payload(task.created_by),
            "created_at": task.created_at,
            "updated_at": task.updated_at,
        }

    @staticmethod
    def _validate_task_id(task_id: int) -> dict:
        try:
            task_value = int(task_id)
        except (TypeError, ValueError):
            return {"success": False, "code": "invalid_task_id", "message": "Invalid task ID."}

        if task_value <= 0:
            return {"success": False, "code": "invalid_task_id", "message": "Invalid task ID."}

        return {"success": True, "value": task_value}

    @staticmethod
    def _get_task(*, task_id: int, for_update: bool = False) -> dict:
        queryset = cast(Any, Task.objects).select_related(
            "project",
            "project__owner",
            "project__owner__role",
            "assigned_to",
            "assigned_to__role",
            "created_by",
            "created_by__role",
        )
        if for_update:
            queryset = queryset.select_for_update()

        try:
            task = queryset.get(pk=task_id)
        except ObjectDoesNotExist:
            return {"success": False, "code": "task_not_found", "message": "Task not found."}

        if task.project.is_archived:
            return {"success": False, "code": "project_inactive", "message": "Inactive project records cannot be modified."}

        return {"success": True, "data": task}

    @staticmethod
    def get_all_tasks(*, search: str = "", filter_field: str = "", filter_value: str = "", sort_by: str = "title", offset: int = 0, limit: int = 10) -> dict:
        allowed_sort_fields = {
            "title": "title",
            "created_at": "created_at",
            "updated_at": "updated_at",
            "project_name": "project__name",
            "assigned_to_email": "assigned_to__email",
            "created_by_email": "created_by__email",
            "priority": "priority",
            "status": "status",
            "due_date": "due_date",
        }
        allowed_filter_fields = {
            "project_id": "project_id",
            "assigned_to_id": "assigned_to_id",
            "created_by_id": "created_by_id",
            "project_key": "project__key",
            "assigned_to_email": "assigned_to__email",
            "priority": "priority",
            "status": "status",
        }

        try:
            limit_value = int(limit)
            offset_value = int(offset)
        except (TypeError, ValueError):
            return {"success": False, "code": "invalid_limit_offset", "message": "Invalid limit or offset parameter."}

        if limit_value < 1 or limit_value > 100:
            return {"success": False, "code": "invalid_limit_offset", "message": "Limit must be between 1 and 100."}

        if offset_value < 0:
            return {"success": False, "code": "invalid_limit_offset", "message": "Offset must be non-negative."}

        sort_value = (sort_by or "title").strip().lower()
        sort_direction = ""
        if sort_value.startswith("-"):
            sort_direction = "-"
            sort_value = sort_value[1:]

        sort_field = allowed_sort_fields.get(sort_value)
        if sort_field is None:
            return {"success": False, "code": "invalid_sort", "message": "Invalid sort parameter."}

        filter_key = (filter_field or "").strip().lower()
        filter_column = None
        if filter_key:
            filter_column = allowed_filter_fields.get(filter_key)
            if filter_column is None:
                return {"success": False, "code": "invalid_filter", "message": "Invalid filter parameter."}
            if not str(filter_value).strip():
                return {"success": False, "code": "invalid_filter_value", "message": "Invalid filter value."}

        try:
            queryset = cast(Any, Task.objects).select_related(
                "project",
                "project__owner",
                "project__owner__role",
                "assigned_to",
                "assigned_to__role",
                "created_by",
                "created_by__role",
            ).all()

            search_term = (search or "").strip()
            if search_term:
                queryset = queryset.filter(
                    Q(title__icontains=search_term)
                    | Q(description__icontains=search_term)
                    | Q(project__name__icontains=search_term)
                    | Q(project__key__icontains=search_term)
                    | Q(assigned_to__email__icontains=search_term)
                    | Q(assigned_to__first_name__icontains=search_term)
                    | Q(assigned_to__last_name__icontains=search_term)
                    | Q(created_by__email__icontains=search_term)
                    | Q(priority__icontains=search_term)
                    | Q(status__icontains=search_term)
                )

            if filter_column in {"project_id", "assigned_to_id", "created_by_id"}:
                try:
                    filter_id = int(filter_value)
                except (TypeError, ValueError):
                    return {"success": False, "code": "invalid_filter_value", "message": "Invalid filter value."}
                if filter_id <= 0:
                    return {"success": False, "code": "invalid_filter_value", "message": "Invalid filter value."}
                queryset = queryset.filter(**{filter_column: filter_id})
            elif filter_column == "project__key":
                queryset = queryset.filter(project__key__iexact=str(filter_value).strip())
            elif filter_column == "assigned_to__email":
                queryset = queryset.filter(assigned_to__email__iexact=str(filter_value).strip())
            elif filter_column in {"priority", "status"}:
                queryset = queryset.filter(**{filter_column: str(filter_value).strip().lower()})

            queryset = queryset.order_by(f"{sort_direction}{sort_field}")
            total_count = queryset.count()
            tasks = queryset[offset_value : offset_value + limit_value]

            return {
                "success": True,
                "message": "Tasks retrieved successfully.",
                "data": [TaskService._build_task_payload(task) for task in tasks],
                "pagination": {"total_count": total_count, "limit": limit_value, "offset": offset_value},
            }
        except (DatabaseError, OperationalError):
            logger.exception("Database error while retrieving tasks.")
            return {"success": False, "code": "server_error", "message": "A server error occurred. Please try again later."}
        except Exception:
            logger.exception("Unexpected error while retrieving tasks.")
            return {"success": False, "code": "server_error", "message": "A server error occurred. Please try again later."}

    @staticmethod
    def get_task_by_id(*, task_id: int) -> dict:
        task_id_result = TaskService._validate_task_id(task_id)
        if not task_id_result["success"]:
            return task_id_result

        try:
            task_result = TaskService._get_task(task_id=task_id_result["value"], for_update=False)
            if not task_result["success"]:
                if task_result["code"] == "project_inactive":
                    task_result["message"] = "Inactive project records cannot be viewed."
                return task_result
        except (DatabaseError, OperationalError):
            logger.exception("Database error while retrieving task %s.", task_id_result["value"])
            return {"success": False, "code": "server_error", "message": "A server error occurred. Please try again later."}
        except Exception:
            logger.exception("Unexpected error while retrieving task %s.", task_id_result["value"])
            return {"success": False, "code": "server_error", "message": "A server error occurred. Please try again later."}

        return {"success": True, "message": "Task retrieved successfully.", "data": TaskService._build_task_payload(task_result["data"])}

    @staticmethod
    def create_task(*, title: str, description: str = "", priority: str = Task.PRIORITY_MEDIUM, status: str = Task.STATUS_TODO, due_date=None, project_id: int, assigned_to_id: int, created_by_id: int) -> dict:
        try:
            project_value = int(project_id)
        except (TypeError, ValueError):
            return {"success": False, "code": "invalid_project_id", "message": "Invalid project ID."}
        if project_value <= 0:
            return {"success": False, "code": "invalid_project_id", "message": "Invalid project ID."}

        try:
            assigned_user_value = int(assigned_to_id)
        except (TypeError, ValueError):
            return {"success": False, "code": "invalid_assigned_to_id", "message": "Invalid assigned user ID."}
        if assigned_user_value <= 0:
            return {"success": False, "code": "invalid_assigned_to_id", "message": "Invalid assigned user ID."}

        try:
            creator_value = int(created_by_id)
        except (TypeError, ValueError):
            return {"success": False, "code": "invalid_created_by_id", "message": "Invalid creator ID."}
        if creator_value <= 0:
            return {"success": False, "code": "invalid_created_by_id", "message": "Invalid creator ID."}

        try:
            with cast(Any, transaction).atomic():
                try:
                    project = cast(Any, Project.objects).select_for_update().select_related("owner", "owner__role").get(pk=project_value)
                except ObjectDoesNotExist:
                    return {"success": False, "code": "project_not_found", "message": "Project not found."}

                if project.is_archived:
                    return {"success": False, "code": "project_inactive", "message": "Inactive projects cannot accept new tasks."}
                if project.owner_id != creator_value:
                    return {"success": False, "code": "permission_denied", "message": "Only the project owner can create tasks."}

                try:
                    assigned_user = cast(Any, User.objects).select_for_update().select_related("role").get(pk=assigned_user_value)
                except ObjectDoesNotExist:
                    return {"success": False, "code": "assigned_user_not_found", "message": "Assigned user not found."}

                if not assigned_user.is_active:
                    return {"success": False, "code": "assigned_user_inactive", "message": "Inactive users cannot be assigned tasks."}
                if not cast(Any, ProjectMember.objects).filter(project_id=project.pk, user_id=assigned_user.pk).exists():
                    return {"success": False, "code": "user_not_in_project", "message": "Assigned user does not belong to this project."}

                creator = project.owner
                task = cast(Any, Task.objects).create(
                    title=title,
                    description=description,
                    priority=priority,
                    status=status,
                    due_date=due_date,
                    project=project,
                    assigned_to=assigned_user,
                    created_by=creator,
                )

                return {"success": True, "message": "Task created successfully.", "data": TaskService._build_task_payload(task)}
        except IntegrityError:
            logger.warning("Task uniqueness race condition caught for project %s and title %s.", project_value, title)
            return {"success": False, "code": "duplicate_task", "message": "A task with this title already exists in the project."}
        except (DatabaseError, OperationalError):
            logger.exception("Database error while creating task for project %s.", project_value)
            return {"success": False, "code": "server_error", "message": "A server error occurred. Please try again later."}
        except Exception:
            logger.exception("Unexpected error while creating task for project %s.", project_value)
            return {"success": False, "code": "server_error", "message": "A server error occurred. Please try again later."}

    @staticmethod
    def update_task(*, task_id: int, requester_id: int, due_date_provided: bool = False, title: str | None = None, description: str | None = None, priority: str | None = None, status: str | None = None, due_date=None, assigned_to_id: int | None = None) -> dict:
        task_id_result = TaskService._validate_task_id(task_id)
        if not task_id_result["success"]:
            return task_id_result

        try:
            requester_value = int(requester_id)
        except (TypeError, ValueError):
            return {"success": False, "code": "permission_denied", "message": "You do not have permission to perform this action."}

        try:
            with cast(Any, transaction).atomic():
                task_result = TaskService._get_task(task_id=task_id_result["value"], for_update=True)
                if not task_result["success"]:
                    if task_result["code"] == "project_inactive":
                        task_result["message"] = "Inactive project records cannot be modified."
                    return task_result

                task = task_result["data"]
                project = task.project
                if project.owner_id != requester_value:
                    return {"success": False, "code": "permission_denied", "message": "Only the project owner can update this task."}

                if assigned_to_id is not None:
                    try:
                        assigned_user_value = int(assigned_to_id)
                    except (TypeError, ValueError):
                        return {"success": False, "code": "invalid_assigned_to_id", "message": "Invalid assigned user ID."}
                    if assigned_user_value <= 0:
                        return {"success": False, "code": "invalid_assigned_to_id", "message": "Invalid assigned user ID."}

                    try:
                        assigned_user = cast(Any, User.objects).select_for_update().select_related("role").get(pk=assigned_user_value)
                    except ObjectDoesNotExist:
                        return {"success": False, "code": "assigned_user_not_found", "message": "Assigned user not found."}

                    if not assigned_user.is_active:
                        return {"success": False, "code": "assigned_user_inactive", "message": "Inactive users cannot be assigned tasks."}
                    if not cast(Any, ProjectMember.objects).filter(project_id=project.pk, user_id=assigned_user.pk).exists():
                        return {"success": False, "code": "user_not_in_project", "message": "Assigned user does not belong to this project."}
                    task.assigned_to = assigned_user

                if title is not None and cast(Any, Task.objects).filter(project_id=project.pk, title__iexact=title).exclude(pk=task.pk).exists():
                    return {"success": False, "code": "duplicate_task", "message": "A task with this title already exists in the project."}

                if title is not None:
                    task.title = title
                if description is not None:
                    task.description = description
                if priority is not None:
                    task.priority = priority
                if status is not None:
                    task.status = status
                if due_date_provided:
                    task.due_date = due_date

                task.save()
                task.refresh_from_db()
                task = cast(Any, Task.objects).select_related(
                    "project",
                    "project__owner",
                    "project__owner__role",
                    "assigned_to",
                    "assigned_to__role",
                    "created_by",
                    "created_by__role",
                ).get(pk=task.pk)

                return {"success": True, "message": "Task updated successfully.", "data": TaskService._build_task_payload(task)}
        except IntegrityError:
            logger.warning("Task uniqueness race condition caught during task update %s.", task_id_result["value"])
            return {"success": False, "code": "duplicate_task", "message": "A task with this title already exists in the project."}
        except (DatabaseError, OperationalError):
            logger.exception("Database error while updating task %s.", task_id_result["value"])
            return {"success": False, "code": "server_error", "message": "A server error occurred. Please try again later."}
        except Exception:
            logger.exception("Unexpected error while updating task %s.", task_id_result["value"])
            return {"success": False, "code": "server_error", "message": "A server error occurred. Please try again later."}
