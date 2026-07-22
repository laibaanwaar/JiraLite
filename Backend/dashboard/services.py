import logging

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied

from projects.models import Project, ProjectMember
from tasks.models import Task


logger = logging.getLogger(__name__)


def _get_display_name(user):
    """
    Return user's full name.
    If first_name and last_name are empty, use email.
    """
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.email


def _get_active_membership(project, user):
    """
    Return ACTIVE ProjectMember relation for the given
    project and user.

    ProjectMember.role is the single source of truth
    for ADMIN/MEMBER role.
    """
    return (
        ProjectMember.objects
        .filter(
            project=project,
            user=user,
            status=ProjectMember.Status.ACTIVE,
        )
        .first()
    )


def get_personal_dashboard(user):
    """
    Build personal dashboard for the logged-in user.

    Returns:
    - projects where user is an ACTIVE member
    - user's role in each project
    - task counts
    - overdue tasks
    - latest 5 assigned tasks

    Archived projects are excluded from the current
    personal work dashboard.
    """

    # -------------------------------------------------
    # 1. Get user's active project memberships
    # -------------------------------------------------

    memberships = list(
        ProjectMember.objects
        .filter(
            user=user,
            status=ProjectMember.Status.ACTIVE,
        )
        .exclude(
            project__status=Project.Status.ARCHIVED,
        )
        .select_related("project")
        .order_by("-joined_at")
    )

    project_ids = [
        membership.project_id
        for membership in memberships
    ]

    # -------------------------------------------------
    # 2. Build projects list and role counts
    # -------------------------------------------------

    projects = []

    admin_projects = 0
    member_projects = 0

    for membership in memberships:

        if membership.role == ProjectMember.Role.ADMIN:
            admin_projects += 1

        elif membership.role == ProjectMember.Role.MEMBER:
            member_projects += 1

        projects.append(
            {
                "id": membership.project.id,
                "name": membership.project.name,
                "project_key": membership.project.project_key,
                "status": membership.project.status,
                "my_role": membership.role,
            }
        )

    # -------------------------------------------------
    # 3. Get tasks assigned to logged-in user
    #
    # Only tasks belonging to projects where user
    # currently has ACTIVE membership are included.
    # -------------------------------------------------

    tasks = Task.objects.filter(
        assigned_to=user,
        project_id__in=project_ids,
    )

    # -------------------------------------------------
    # 4. Task status counts
    # -------------------------------------------------

    task_summary = tasks.aggregate(

        total_tasks=Count("id"),

        todo_tasks=Count(
            "id",
            filter=Q(
                status=Task.Status.TODO
            ),
        ),

        in_progress_tasks=Count(
            "id",
            filter=Q(
                status=Task.Status.IN_PROGRESS
            ),
        ),

        done_tasks=Count(
            "id",
            filter=Q(
                status=Task.Status.DONE
            ),
        ),
    )

    # -------------------------------------------------
    # 5. Overdue tasks
    #
    # Overdue:
    # due_date < today
    # AND task is not DONE
    # -------------------------------------------------

    today = timezone.localdate()

    overdue_tasks = (
        tasks
        .filter(
            due_date__isnull=False,
            due_date__lt=today,
        )
        .exclude(
            status=Task.Status.DONE,
        )
        .count()
    )

    # -------------------------------------------------
    # 6. Latest 5 assigned tasks
    # -------------------------------------------------

    recent_task_objects = (
        tasks
        .select_related(
            "project",
            "assigned_to",
            "created_by",
        )
        .order_by("-updated_at")[:5]
    )

    recent_tasks = []

    for task in recent_task_objects:

        recent_tasks.append(
            {
                "id": task.id,
                "title": task.title,
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date,

                "project": {
                    "id": task.project.id,
                    "name": task.project.name,
                    "project_key": task.project.project_key,
                },
            }
        )

    # -------------------------------------------------
    # 7. Final response data
    # -------------------------------------------------

    return {

        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
        },

        "summary": {

            "total_projects": len(projects),

            "admin_projects": admin_projects,

            "member_projects": member_projects,

            "total_tasks": (
                task_summary["total_tasks"] or 0
            ),

            "todo_tasks": (
                task_summary["todo_tasks"] or 0
            ),

            "in_progress_tasks": (
                task_summary["in_progress_tasks"] or 0
            ),

            "done_tasks": (
                task_summary["done_tasks"] or 0
            ),

            "overdue_tasks": overdue_tasks,
        },

        "projects": projects,

        "recent_tasks": recent_tasks,
    }


def get_project_dashboard(project_id, requesting_user):
    """
    Build dashboard for one project.

    Access:
    - ACTIVE ADMIN  -> allowed
    - ACTIVE MEMBER -> allowed
    - INACTIVE member -> forbidden
    - outsider -> forbidden

    Returns:
    - project details
    - current user's role
    - members and their roles
    - task statistics
    - progress
    - priority distribution
    - task statistics per active member
    """

    # -------------------------------------------------
    # 1. Validate project
    # -------------------------------------------------

    project = (
        Project.objects
        .filter(id=project_id)
        .first()
    )

    if project is None:
        raise NotFound(
            "Project not found."
        )

    # -------------------------------------------------
    # 2. Check current user's active membership
    # -------------------------------------------------

    current_membership = _get_active_membership(
        project=project,
        user=requesting_user,
    )

    if current_membership is None:
        raise PermissionDenied(
            "You are not an active member of this project."
        )

    # -------------------------------------------------
    # 3. Get all ACTIVE project members
    # -------------------------------------------------

    memberships = list(
        ProjectMember.objects
        .filter(
            project=project,
            status=ProjectMember.Status.ACTIVE,
        )
        .select_related("user")
        .order_by(
            "role",
            "joined_at",
        )
    )

    # -------------------------------------------------
    # 4. Get project tasks
    # -------------------------------------------------

    project_tasks = Task.objects.filter(
        project=project
    )

    # -------------------------------------------------
    # 5. Task counts + priority counts
    # -------------------------------------------------

    task_summary = project_tasks.aggregate(

        total_tasks=Count("id"),

        todo_tasks=Count(
            "id",
            filter=Q(
                status=Task.Status.TODO
            ),
        ),

        in_progress_tasks=Count(
            "id",
            filter=Q(
                status=Task.Status.IN_PROGRESS
            ),
        ),

        done_tasks=Count(
            "id",
            filter=Q(
                status=Task.Status.DONE
            ),
        ),

        high_priority_tasks=Count(
            "id",
            filter=Q(
                priority=Task.Priority.HIGH
            ),
        ),

        medium_priority_tasks=Count(
            "id",
            filter=Q(
                priority=Task.Priority.MEDIUM
            ),
        ),

        low_priority_tasks=Count(
            "id",
            filter=Q(
                priority=Task.Priority.LOW
            ),
        ),
    )

    total_tasks = (
        task_summary["total_tasks"] or 0
    )

    done_tasks = (
        task_summary["done_tasks"] or 0
    )

    # -------------------------------------------------
    # 6. Calculate progress safely
    #
    # Prevent division-by-zero when project has no tasks.
    # -------------------------------------------------

    if total_tasks == 0:
        progress_percentage = 0.0

    else:
        progress_percentage = round(
            (done_tasks / total_tasks) * 100,
            2,
        )

    # -------------------------------------------------
    # 7. Calculate overdue tasks
    # -------------------------------------------------

    today = timezone.localdate()

    overdue_tasks = (
        project_tasks
        .filter(
            due_date__isnull=False,
            due_date__lt=today,
        )
        .exclude(
            status=Task.Status.DONE,
        )
        .count()
    )

    # -------------------------------------------------
    # 8. Group task statistics by assigned user
    #
    # Single grouped query prevents N+1 queries.
    # -------------------------------------------------

    task_stats_by_user = {

        row["assigned_to_id"]: row

        for row in (
            project_tasks
            .values("assigned_to_id")
            .annotate(

                total_tasks=Count("id"),

                todo_tasks=Count(
                    "id",
                    filter=Q(
                        status=Task.Status.TODO
                    ),
                ),

                in_progress_tasks=Count(
                    "id",
                    filter=Q(
                        status=Task.Status.IN_PROGRESS
                    ),
                ),

                done_tasks=Count(
                    "id",
                    filter=Q(
                        status=Task.Status.DONE
                    ),
                ),
            )
        )
    }

    # -------------------------------------------------
    # 9. Build member information
    # -------------------------------------------------

    members = []

    member_task_summary = []

    for membership in memberships:

        member = membership.user

        members.append(
            {
                "user_id": member.id,

                "name": _get_display_name(
                    member
                ),

                "email": member.email,

                "role": membership.role,

                "status": membership.status,

                "joined_at": membership.joined_at,
            }
        )

        stats = task_stats_by_user.get(
            member.id,
            {},
        )

        member_task_summary.append(
            {
                "user_id": member.id,

                "name": _get_display_name(
                    member
                ),

                "role": membership.role,

                "total_tasks": stats.get(
                    "total_tasks",
                    0,
                ),

                "todo_tasks": stats.get(
                    "todo_tasks",
                    0,
                ),

                "in_progress_tasks": stats.get(
                    "in_progress_tasks",
                    0,
                ),

                "done_tasks": stats.get(
                    "done_tasks",
                    0,
                ),
            }
        )

    # -------------------------------------------------
    # 10. Final response
    # -------------------------------------------------

    return {

        "project": {

            "id": project.id,

            "name": project.name,

            "project_key": project.project_key,

            "description": project.description,

            "status": project.status,

            "start_date": project.start_date,

            "end_date": project.end_date,
        },

        # Tells frontend whether currently logged-in
        # person is ADMIN or MEMBER of THIS project.
        "current_user_role": (
            current_membership.role
        ),

        "summary": {

            "total_members": len(members),

            "total_tasks": total_tasks,

            "todo_tasks": (
                task_summary["todo_tasks"] or 0
            ),

            "in_progress_tasks": (
                task_summary["in_progress_tasks"] or 0
            ),

            "done_tasks": done_tasks,

            "overdue_tasks": overdue_tasks,

            "progress_percentage": (
                progress_percentage
            ),
        },

        "members": members,

        "tasks_by_priority": {

            "HIGH": (
                task_summary[
                    "high_priority_tasks"
                ] or 0
            ),

            "MEDIUM": (
                task_summary[
                    "medium_priority_tasks"
                ] or 0
            ),

            "LOW": (
                task_summary[
                    "low_priority_tasks"
                ] or 0
            ),
        },

        "member_task_summary": (
            member_task_summary
        ),
    }