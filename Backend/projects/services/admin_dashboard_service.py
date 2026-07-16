from dataclasses import dataclass

from django.core.exceptions import ValidationError
from django.db.models import Count, Prefetch, Q, QuerySet
from django.utils import timezone

from projects.models import Project, ProjectInvitation, ProjectMember, Task


class AdminDashboardPermissionError(PermissionError):
    pass


class AdminDashboardNotFoundError(LookupError):
    pass


@dataclass(frozen=True)
class SelectedProjectContext:
    project: Project
    membership: ProjectMember


class AdminDashboardService:
    ADMIN_ROLES = {ProjectMember.ROLE_OWNER, ProjectMember.ROLE_ADMIN}
    STATUS_LABELS = {
        Task.STATUS_TO_DO: "To Do",
        Task.STATUS_IN_PROGRESS: "In Progress",
        Task.STATUS_IN_REVIEW: "In Review",
        Task.STATUS_DONE: "Done",
    }
    PRIORITY_LABELS = {
        Task.PRIORITY_LOW: "Low",
        Task.PRIORITY_MEDIUM: "Medium",
        Task.PRIORITY_HIGH: "High",
        Task.PRIORITY_URGENT: "Urgent",
    }

    @staticmethod
    def _managed_memberships_queryset(*, user) -> QuerySet[ProjectMember]:
        return ProjectMember.objects.select_related("project").filter(
            user=user,
            role__in=AdminDashboardService.ADMIN_ROLES,
            project__is_active=True,
        )

    @staticmethod
    def _parse_selected_project(*, user, project_id) -> SelectedProjectContext | None:
        if project_id in (None, ""):
            return None

        try:
            normalized_project_id = int(project_id)
        except (TypeError, ValueError) as exc:
            raise ValidationError({"project_id": ["A valid project ID is required."]}) from exc

        try:
            project = Project.objects.get(id=normalized_project_id, is_active=True)
        except Project.DoesNotExist as exc:
            raise AdminDashboardNotFoundError("Project not found.") from exc

        try:
            membership = ProjectMember.objects.get(project=project, user=user)
        except ProjectMember.DoesNotExist as exc:
            raise AdminDashboardPermissionError("You do not have permission to access this admin dashboard.") from exc

        if membership.role not in AdminDashboardService.ADMIN_ROLES:
            raise AdminDashboardPermissionError("You do not have permission to access this admin dashboard.")

        return SelectedProjectContext(project=project, membership=membership)

    @staticmethod
    def _managed_projects_queryset(*, user, selected_project: SelectedProjectContext | None) -> QuerySet[Project]:
        queryset = Project.objects.filter(
            is_active=True,
            members__user=user,
            members__role__in=AdminDashboardService.ADMIN_ROLES,
        ).distinct()

        if selected_project is not None:
            queryset = queryset.filter(id=selected_project.project.id)

        return queryset

    @staticmethod
    def _task_queryset(*, managed_projects: QuerySet[Project]) -> QuerySet[Task]:
        return Task.objects.select_related(
            "project",
            "assignee",
            "assignee__user",
        ).filter(
            is_active=True,
            project__in=managed_projects,
            project__is_active=True,
        )

    @staticmethod
    def _summary(*, managed_projects: QuerySet[Project], tasks: QuerySet[Task]) -> dict:
        today = timezone.localdate()
        project_ids = managed_projects.values("id")

        task_counts = tasks.aggregate(
            total_tasks=Count("id", distinct=True),
            to_do_tasks=Count("id", filter=Q(status=Task.STATUS_TO_DO), distinct=True),
            in_progress_tasks=Count("id", filter=Q(status=Task.STATUS_IN_PROGRESS), distinct=True),
            in_review_tasks=Count("id", filter=Q(status=Task.STATUS_IN_REVIEW), distinct=True),
            completed_tasks=Count("id", filter=Q(status=Task.STATUS_DONE), distinct=True),
            overdue_tasks=Count(
                "id",
                filter=Q(due_date__lt=today) & ~Q(status=Task.STATUS_DONE),
                distinct=True,
            ),
        )

        total_members = ProjectMember.objects.filter(
            project__in=project_ids,
            project__is_active=True,
        ).aggregate(count=Count("id", distinct=True))["count"] or 0

        pending_invitations = ProjectInvitation.objects.filter(
            project__in=project_ids,
            project__is_active=True,
            status=ProjectInvitation.STATUS_PENDING,
        ).aggregate(count=Count("id", distinct=True))["count"] or 0

        return {
            "total_projects": managed_projects.count(),
            "total_members": total_members,
            "total_tasks": task_counts["total_tasks"] or 0,
            "to_do_tasks": task_counts["to_do_tasks"] or 0,
            "in_progress_tasks": task_counts["in_progress_tasks"] or 0,
            "in_review_tasks": task_counts["in_review_tasks"] or 0,
            "completed_tasks": task_counts["completed_tasks"] or 0,
            "overdue_tasks": task_counts["overdue_tasks"] or 0,
            "pending_invitations": pending_invitations,
        }

    @staticmethod
    def _tasks_by_status(*, tasks: QuerySet[Task]) -> list[dict]:
        aggregates = tasks.aggregate(
            to_do=Count("id", filter=Q(status=Task.STATUS_TO_DO), distinct=True),
            in_progress=Count("id", filter=Q(status=Task.STATUS_IN_PROGRESS), distinct=True),
            in_review=Count("id", filter=Q(status=Task.STATUS_IN_REVIEW), distinct=True),
            done=Count("id", filter=Q(status=Task.STATUS_DONE), distinct=True),
        )
        return [
            {
                "status": Task.STATUS_TO_DO,
                "label": AdminDashboardService.STATUS_LABELS[Task.STATUS_TO_DO],
                "count": aggregates["to_do"] or 0,
            },
            {
                "status": Task.STATUS_IN_PROGRESS,
                "label": AdminDashboardService.STATUS_LABELS[Task.STATUS_IN_PROGRESS],
                "count": aggregates["in_progress"] or 0,
            },
            {
                "status": Task.STATUS_IN_REVIEW,
                "label": AdminDashboardService.STATUS_LABELS[Task.STATUS_IN_REVIEW],
                "count": aggregates["in_review"] or 0,
            },
            {
                "status": Task.STATUS_DONE,
                "label": AdminDashboardService.STATUS_LABELS[Task.STATUS_DONE],
                "count": aggregates["done"] or 0,
            },
        ]

    @staticmethod
    def _tasks_by_priority(*, tasks: QuerySet[Task]) -> list[dict]:
        aggregates = tasks.aggregate(
            low=Count("id", filter=Q(priority=Task.PRIORITY_LOW), distinct=True),
            medium=Count("id", filter=Q(priority=Task.PRIORITY_MEDIUM), distinct=True),
            high=Count("id", filter=Q(priority=Task.PRIORITY_HIGH), distinct=True),
            urgent=Count("id", filter=Q(priority=Task.PRIORITY_URGENT), distinct=True),
        )
        return [
            {
                "priority": Task.PRIORITY_LOW,
                "label": AdminDashboardService.PRIORITY_LABELS[Task.PRIORITY_LOW],
                "count": aggregates["low"] or 0,
            },
            {
                "priority": Task.PRIORITY_MEDIUM,
                "label": AdminDashboardService.PRIORITY_LABELS[Task.PRIORITY_MEDIUM],
                "count": aggregates["medium"] or 0,
            },
            {
                "priority": Task.PRIORITY_HIGH,
                "label": AdminDashboardService.PRIORITY_LABELS[Task.PRIORITY_HIGH],
                "count": aggregates["high"] or 0,
            },
            {
                "priority": Task.PRIORITY_URGENT,
                "label": AdminDashboardService.PRIORITY_LABELS[Task.PRIORITY_URGENT],
                "count": aggregates["urgent"] or 0,
            },
        ]

    @staticmethod
    def _recent_projects(*, managed_projects: QuerySet[Project], user) -> list[dict]:
        recent_projects = (
            managed_projects.filter(members__user=user, members__role__in=AdminDashboardService.ADMIN_ROLES)
            .annotate(
                total_members=Count("members", distinct=True),
                total_tasks=Count("tasks", filter=Q(tasks__is_active=True), distinct=True),
                completed_tasks=Count(
                    "tasks",
                    filter=Q(tasks__is_active=True, tasks__status=Task.STATUS_DONE),
                    distinct=True,
                ),
            )
            .order_by("-updated_at", "-created_at")[:5]
        )

        payload = []
        for project in recent_projects:
            membership = next(
                (
                    membership
                    for membership in project.members.all()
                    if membership.user_id == user.id and membership.role in AdminDashboardService.ADMIN_ROLES
                ),
                None,
            )
            total_tasks = project.total_tasks or 0
            completed_tasks = project.completed_tasks or 0
            completion_percentage = round((completed_tasks / total_tasks) * 100, 2) if total_tasks else 0
            payload.append(
                {
                    "id": project.id,
                    "name": project.name,
                    "description": project.description,
                    "current_user_role": membership.role if membership else ProjectMember.ROLE_ADMIN,
                    "total_members": project.total_members or 0,
                    "total_tasks": total_tasks,
                    "completed_tasks": completed_tasks,
                    "completion_percentage": completion_percentage,
                    "created_at": project.created_at,
                    "updated_at": project.updated_at,
                }
            )
        return payload

    @staticmethod
    def _recent_tasks(*, tasks: QuerySet[Task]) -> list[dict]:
        recent_tasks = tasks.order_by("-updated_at", "-created_at")[:5]
        return [
            {
                "id": task.id,
                "title": task.title,
                "project": {
                    "id": task.project.id,
                    "name": task.project.name,
                },
                "assignee": {
                    "project_member_id": task.assignee.id,
                    "user_id": task.assignee.user.id,
                    "first_name": task.assignee.user.first_name,
                    "last_name": task.assignee.user.last_name,
                },
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date,
                "created_at": task.created_at,
                "updated_at": task.updated_at,
            }
            for task in recent_tasks
        ]

    @staticmethod
    def _upcoming_deadlines(*, tasks: QuerySet[Task]) -> list[dict]:
        today = timezone.localdate()
        upcoming_tasks = tasks.filter(
            due_date__isnull=False,
            due_date__gte=today,
        ).exclude(status=Task.STATUS_DONE).order_by("due_date", "updated_at", "id")[:5]

        return [
            {
                "task_id": task.id,
                "title": task.title,
                "project_id": task.project.id,
                "project_name": task.project.name,
                "assignee": {
                    "project_member_id": task.assignee.id,
                    "user_id": task.assignee.user.id,
                    "first_name": task.assignee.user.first_name,
                    "last_name": task.assignee.user.last_name,
                },
                "priority": task.priority,
                "status": task.status,
                "due_date": task.due_date,
            }
            for task in upcoming_tasks
        ]

    @staticmethod
    def get_admin_dashboard(*, user, project_id=None) -> dict:
        selected_project = AdminDashboardService._parse_selected_project(user=user, project_id=project_id)

        managed_projects = (
            AdminDashboardService._managed_projects_queryset(user=user, selected_project=selected_project)
            .prefetch_related(
                Prefetch(
                    "members",
                    queryset=ProjectMember.objects.filter(
                        user=user,
                        role__in=AdminDashboardService.ADMIN_ROLES,
                    ),
                )
            )
        )
        tasks = AdminDashboardService._task_queryset(managed_projects=managed_projects)

        has_managed_projects = managed_projects.exists()
        data = {
            "view": "admin",
            "selected_project": (
                {
                    "id": selected_project.project.id,
                    "name": selected_project.project.name,
                    "current_user_role": selected_project.membership.role,
                }
                if selected_project is not None
                else None
            ),
            "summary": AdminDashboardService._summary(managed_projects=managed_projects, tasks=tasks),
            "tasks_by_status": AdminDashboardService._tasks_by_status(tasks=tasks),
            "tasks_by_priority": AdminDashboardService._tasks_by_priority(tasks=tasks),
            "recent_projects": AdminDashboardService._recent_projects(managed_projects=managed_projects, user=user),
            "recent_tasks": AdminDashboardService._recent_tasks(tasks=tasks),
            "upcoming_deadlines": AdminDashboardService._upcoming_deadlines(tasks=tasks),
            "permissions": {
                "can_create_project": True,
                "can_create_task": has_managed_projects,
                "can_invite_users": has_managed_projects,
                "can_manage_members": has_managed_projects,
            },
        }

        return {
            "success": True,
            "message": (
                "Project admin dashboard retrieved successfully."
                if selected_project is not None
                else "Admin dashboard retrieved successfully."
            ),
            "data": data,
        }
