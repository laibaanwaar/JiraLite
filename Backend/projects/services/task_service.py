import logging
from typing import Any, cast

from django.core.exceptions import ValidationError
from django.core.paginator import EmptyPage, Paginator
from django.db import DatabaseError, transaction
from django.db.models import Count, Q, QuerySet

from projects.models import Project, ProjectMember, Task
from projects.permissions import is_account_admin


logger = logging.getLogger(__name__)


class TaskPermissionError(PermissionError):
    pass


class TaskNotFoundError(LookupError):
    pass


class TaskService:
    ADMIN_ROLES = {ProjectMember.ROLE_OWNER, ProjectMember.ROLE_ADMIN}
    EMPTY_FILTER_VALUES = {"", "all", "none", "null", "undefined", "all projects", "all statuses", "all status", "all priority", "all priorities"}
    VALID_ORDERING_FIELDS = {
        "created_at",
        "-created_at",
        "due_date",
        "-due_date",
        "priority",
        "-priority",
        "status",
        "-status",
        "title",
        "-title",
    }

    @staticmethod
    def _base_queryset() -> QuerySet[Task]:
        return Task.objects.select_related(
            "project",
            "assignee",
            "assignee__user",
            "created_by",
        )

    @staticmethod
    def _with_comment_count(queryset: QuerySet[Task]) -> QuerySet[Task]:
        return queryset.annotate(comment_count=Count("comments", distinct=True))

    @staticmethod
    def _get_membership(*, user, project: Project) -> ProjectMember:
        try:
            return ProjectMember.objects.select_related("project", "user").get(project=project, user=user)
        except ProjectMember.DoesNotExist as exc:
            raise TaskPermissionError("You are not a member of this project.") from exc

    @staticmethod
    def _require_account_admin(*, user) -> None:
        if not is_account_admin(user):
            raise TaskPermissionError("Permission denied.")

    @staticmethod
    def _get_active_project(*, project_id: int) -> Project:
        try:
            project = Project.objects.get(id=project_id, is_active=True)
        except Project.DoesNotExist as exc:
            raise TaskNotFoundError("Project not found.") from exc
        return project

    @staticmethod
    def _validate_assignee(*, project: Project, assignee_id: int) -> ProjectMember:
        try:
            assignee = ProjectMember.objects.select_related("user", "project").get(id=assignee_id)
        except ProjectMember.DoesNotExist as exc:
            raise ValidationError({"assignee_id": ["Assignee not found."]}) from exc

        if assignee.project_id != project.id:
            raise ValidationError({"assignee_id": ["Assignee must belong to the same project."]})
        if not assignee.user.is_active:
            raise ValidationError({"assignee_id": ["Assignee user must be active."]})
        return assignee

    @staticmethod
    def _clean_filter_value(value) -> str | None:
        if value is None:
            return None
        cleaned = str(value).strip()
        if cleaned.lower() in TaskService.EMPTY_FILTER_VALUES:
            return None
        return cleaned

    @staticmethod
    def _apply_filters(queryset: QuerySet[Task], *, params, allow_project_filter: bool) -> QuerySet[Task]:
        status_value = TaskService._clean_filter_value(params.get("status"))
        if status_value:
            queryset = queryset.filter(status=status_value)

        priority_value = TaskService._clean_filter_value(params.get("priority"))
        if priority_value:
            queryset = queryset.filter(priority=priority_value)

        assignee_id = TaskService._clean_filter_value(params.get("assignee_id"))
        if assignee_id:
            if not str(assignee_id).isdigit():
                raise ValidationError({"assignee_id": ["assignee_id must be an integer."]})
            queryset = queryset.filter(assignee_id=int(assignee_id))

        project_id = TaskService._clean_filter_value(params.get("project_id"))
        if allow_project_filter and project_id:
            if not str(project_id).isdigit():
                raise ValidationError({"project_id": ["project_id must be an integer."]})
            queryset = queryset.filter(project_id=int(project_id))

        due_date = TaskService._clean_filter_value(params.get("due_date"))
        if due_date:
            queryset = queryset.filter(due_date=due_date)

        search = TaskService._clean_filter_value(params.get("search")) or ""
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(assignee__user__first_name__icontains=search)
                | Q(assignee__user__last_name__icontains=search)
                | Q(assignee__user__email__icontains=search)
            )

        ordering = TaskService._clean_filter_value(params.get("ordering")) or "-created_at"
        if ordering not in TaskService.VALID_ORDERING_FIELDS:
            raise ValidationError({"ordering": ["Invalid ordering value."]})
        return queryset.order_by(ordering)

    @staticmethod
    def _paginate_queryset(queryset: QuerySet[Task], *, params) -> dict:
        page = TaskService._clean_filter_value(params.get("page")) or 1
        page_size = TaskService._clean_filter_value(params.get("page_size")) or 10

        try:
            page_number = int(page)
            page_size_number = int(page_size)
        except (TypeError, ValueError) as exc:
            raise ValidationError({"page": ["page and page_size must be integers."]}) from exc

        if page_number < 1 or page_size_number < 1 or page_size_number > 100:
            raise ValidationError({"page_size": ["page_size must be between 1 and 100."]})

        paginator = Paginator(queryset, page_size_number)
        try:
            page_obj = paginator.page(page_number)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages) if paginator.num_pages else []

        return {
            "count": paginator.count,
            "results": list(page_obj.object_list) if paginator.count else [],
        }

    @staticmethod
    def create_task(*, user, project_id: int, validated_data: dict) -> Task:
        project = TaskService._get_active_project(project_id=project_id)
        membership = TaskService._get_membership(user=user, project=project)
        if membership.role not in TaskService.ADMIN_ROLES:
            raise TaskPermissionError("You do not have permission to create tasks in this project.")
        assignee = TaskService._validate_assignee(project=project, assignee_id=validated_data["assignee_id"])

        with cast(Any, transaction).atomic():
            task = Task.objects.create(
                project=project,
                title=validated_data["title"],
                description=validated_data.get("description", ""),
                assignee=assignee,
                created_by=user,
                priority=validated_data["priority"],
                status=validated_data["status"],
                due_date=validated_data.get("due_date"),
                is_active=True,
            )
        return cast(Task, TaskService._base_queryset().get(id=task.id))

    @staticmethod
    def list_project_tasks(*, user, project_id: int, params) -> dict:
        project = TaskService._get_active_project(project_id=project_id)
        membership = TaskService._get_membership(user=user, project=project)
        queryset = TaskService._base_queryset().filter(project=project, is_active=True)
        if membership.role not in TaskService.ADMIN_ROLES:
            queryset = queryset.filter(assignee__user=user)
        filtered = TaskService._with_comment_count(TaskService._apply_filters(queryset, params=params, allow_project_filter=False))
        return TaskService._paginate_queryset(filtered, params=params)

    @staticmethod
    def list_accessible_tasks(*, user, params) -> dict:
        TaskService._require_account_admin(user=user)
        queryset = TaskService._base_queryset().filter(
            is_active=True,
            project__is_active=True,
        )
        queryset = queryset.distinct()
        filtered = TaskService._with_comment_count(TaskService._apply_filters(queryset, params=params, allow_project_filter=True))
        return TaskService._paginate_queryset(filtered, params=params)

    @staticmethod
    def list_my_tasks(*, user, params) -> dict:
        queryset = TaskService._base_queryset().filter(
            is_active=True,
            project__is_active=True,
            assignee__user=user,
            project__members__user=user,
        ).distinct()
        filtered = TaskService._with_comment_count(TaskService._apply_filters(queryset, params=params, allow_project_filter=True))
        return TaskService._paginate_queryset(filtered, params=params)

    @staticmethod
    def get_task(*, user, task_id: int) -> Task:
        try:
            task = TaskService._base_queryset().get(
                id=task_id,
                is_active=True,
                project__is_active=True,
            )
        except Task.DoesNotExist as exc:
            raise TaskNotFoundError("Task not found.") from exc
        membership = TaskService._get_membership(user=user, project=task.project)
        if membership.role not in TaskService.ADMIN_ROLES and task.assignee.user_id != user.id:
            raise TaskPermissionError("Permission denied.")
        return task

    @staticmethod
    def update_task(*, user, task_id: int, validated_data: dict) -> Task:
        with cast(Any, transaction).atomic():
            try:
                task = (
                    TaskService._base_queryset()
                    .select_for_update()
                    .get(id=task_id, is_active=True, project__is_active=True)
                )
            except Task.DoesNotExist as exc:
                raise TaskNotFoundError("Task not found.") from exc

            membership = TaskService._get_membership(user=user, project=task.project)
            if membership.role not in TaskService.ADMIN_ROLES:
                raise TaskPermissionError("You do not have permission to update this task.")

            allowed_fields = {"title", "description", "assignee_id", "priority", "status", "due_date"}

            invalid_fields = sorted(set(validated_data.keys()) - allowed_fields)
            if invalid_fields:
                raise TaskPermissionError("You do not have permission to update the submitted fields.")

            if "title" in validated_data:
                task.title = validated_data["title"]
            if "description" in validated_data:
                task.description = validated_data["description"]
            if "priority" in validated_data:
                task.priority = validated_data["priority"]
            if "status" in validated_data:
                task.status = validated_data["status"]
            if "due_date" in validated_data:
                task.due_date = validated_data["due_date"]
            if "assignee_id" in validated_data:
                task.assignee = TaskService._validate_assignee(
                    project=task.project,
                    assignee_id=validated_data["assignee_id"],
                )

            task.save()
        return cast(Task, TaskService._base_queryset().get(id=task.id))

    @staticmethod
    def delete_task(*, user, task_id: int) -> None:
        with cast(Any, transaction).atomic():
            try:
                task = Task.objects.select_related("project").select_for_update().get(
                    id=task_id,
                    project__is_active=True,
                )
            except Task.DoesNotExist as exc:
                raise TaskNotFoundError("Task not found.") from exc

            membership = TaskService._get_membership(user=user, project=task.project)
            if membership.role not in TaskService.ADMIN_ROLES:
                raise TaskPermissionError("You do not have permission to delete this task.")

            if task.is_active:
                task.is_active = False
                task.save(update_fields=["is_active", "updated_at"])
