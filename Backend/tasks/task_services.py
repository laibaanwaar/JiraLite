import logging

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import (
    NotFound,
    PermissionDenied,
)

from projects.models import (
    Project,
    ProjectMember,
)

from .models import Task


logger = logging.getLogger(__name__)


def _get_project(project_id):
    project = Project.objects.filter(
        pk=project_id
    ).first()

    if project is None:
        raise NotFound(
            "Project not found."
        )

    return project


def _ensure_project_active(project):
    if project.status != Project.Status.ACTIVE:
        raise serializers.ValidationError(
            {
                "project": (
                    "Tasks can only be modified "
                    "while the project is active."
                )
            }
        )


def _is_project_admin(project, user):
    return ProjectMember.objects.filter(
        project=project,
        user=user,
        role=ProjectMember.Role.ADMIN,
        status=ProjectMember.Status.ACTIVE,
    ).exists()


def _ensure_project_admin(project, user):
    if not _is_project_admin(
        project=project,
        user=user,
    ):
        raise PermissionDenied(
            "Only the Project Admin can perform this action."
        )


def _is_active_project_member(
    project,
    user,
):
    return ProjectMember.objects.filter(
        project=project,
        user=user,
        status=ProjectMember.Status.ACTIVE,
    ).exists()


def _validate_assignee(
    project,
    assignee,
):
    """
    User must be an ACTIVE member of
    exactly the same project.
    """

    is_member = ProjectMember.objects.filter(
        project=project,
        user=assignee,
        status=ProjectMember.Status.ACTIVE,
    ).exists()

    if not is_member:
        raise serializers.ValidationError(
            {
                "assigned_to": (
                    "Selected user is not an active "
                    "member of this project."
                )
            }
        )


def _validate_due_date(
    project,
    due_date,
):
    if due_date is None:
        return

    if (
        project.start_date
        and due_date < project.start_date
    ):
        raise serializers.ValidationError(
            {
                "due_date": (
                    "Task due date cannot be before "
                    "the project start date."
                )
            }
        )

    if (
        project.end_date
        and due_date > project.end_date
    ):
        raise serializers.ValidationError(
            {
                "due_date": (
                    "Task due date cannot be after "
                    "the project end date."
                )
            }
        )


@transaction.atomic
def create_task(
    project_id,
    requesting_user,
    validated_data,
):
    project = (
        Project.objects
        .select_for_update()
        .filter(pk=project_id)
        .first()
    )

    if project is None:
        raise NotFound(
            "Project not found."
        )

    _ensure_project_active(project)

    _ensure_project_admin(
        project=project,
        user=requesting_user,
    )

    assignee = validated_data[
        "assigned_to"
    ]

    _validate_assignee(
        project=project,
        assignee=assignee,
    )

    due_date = validated_data.get(
        "due_date"
    )

    _validate_due_date(
        project=project,
        due_date=due_date,
    )

    try:
        task = Task.objects.create(
            project=project,
            created_by=requesting_user,
            assigned_to=assignee,
            title=validated_data["title"],
            description=validated_data.get(
                "description",
                "",
            ),
            priority=validated_data.get(
                "priority",
                Task.Priority.MEDIUM,
            ),
            status=Task.Status.TODO,
            due_date=due_date,
        )

    except IntegrityError as exc:
        logger.exception(
            "Database integrity error while creating task."
        )

        raise serializers.ValidationError(
            {
                "detail": (
                    "Task could not be created because "
                    "of invalid relational data."
                )
            }
        ) from exc

    return task


def get_project_tasks(
    project_id,
    requesting_user,
):
    project = _get_project(project_id)

    """
    Task visibility rules:

    - ACTIVE Project Admin:
      can see all tasks in the project.

    - ACTIVE Project Member:
      can see only tasks assigned to themselves.

    - Non-member / inactive member:
      access is denied.
    """

    membership = (
        ProjectMember.objects
        .filter(
            project=project,
            user=requesting_user,
            status=ProjectMember.Status.ACTIVE,
        )
        .first()
    )

    if membership is None:
        raise PermissionDenied(
            "You are not an active member of this project."
        )

    if membership.role == ProjectMember.Role.ADMIN:
        tasks = Task.objects.filter(
            project=project,
        )
    else:
        tasks = Task.objects.filter(
            project=project,
            assigned_to=requesting_user,
        )

    tasks = (
        tasks
        .select_related(
            "project",
            "assigned_to",
            "created_by",
        )
        .order_by(
            "status",
            "due_date",
            "-created_at",
        )
    )

    return project, tasks

def get_accessible_task(
    task_id,
    requesting_user,
):
    """
    Accessible only to:
    - project ADMIN
    - active assignee
    """

    task = (
        Task.objects
        .select_related(
            "project",
            "assigned_to",
            "created_by",
        )
        .filter(pk=task_id)
        .first()
    )

    if task is None:
        raise NotFound(
            "Task not found."
        )

    is_admin = _is_project_admin(
        project=task.project,
        user=requesting_user,
    )

    is_assignee = (
        task.assigned_to_id
        == requesting_user.id
        and _is_active_project_member(
            project=task.project,
            user=requesting_user,
        )
    )

    if not is_admin and not is_assignee:
        # Hide existence from unauthorized users.
        raise NotFound(
            "Task not found or you do not have access."
        )

    return task


@transaction.atomic
def update_task(
    task_id,
    requesting_user,
    validated_data,
):
    task = (
        Task.objects
        .select_for_update()
        .select_related("project")
        .filter(pk=task_id)
        .first()
    )

    if task is None:
        raise NotFound(
            "Task not found."
        )

    _ensure_project_admin(
        project=task.project,
        user=requesting_user,
    )

    _ensure_project_active(
        task.project
    )

    if "assigned_to" in validated_data:
        new_assignee = validated_data[
            "assigned_to"
        ]

        _validate_assignee(
            project=task.project,
            assignee=new_assignee,
        )

        task.assigned_to = new_assignee

    if "due_date" in validated_data:
        _validate_due_date(
            project=task.project,
            due_date=validated_data[
                "due_date"
            ],
        )

    editable_fields = [
        "title",
        "description",
        "priority",
        "due_date",
    ]

    for field in editable_fields:
        if field in validated_data:
            setattr(
                task,
                field,
                validated_data[field],
            )

    task.save()

    return task


@transaction.atomic
def delete_task(
    task_id,
    requesting_user,
):
    task = (
        Task.objects
        .select_for_update()
        .select_related("project")
        .filter(pk=task_id)
        .first()
    )

    if task is None:
        raise NotFound(
            "Task not found."
        )

    _ensure_project_admin(
        project=task.project,
        user=requesting_user,
    )

    _ensure_project_active(
        task.project
    )

    task.delete()


@transaction.atomic
def update_task_status(
    task_id,
    requesting_user,
    new_status,
):
    task = (
        Task.objects
        .select_for_update()
        .select_related(
            "project",
            "assigned_to",
        )
        .filter(pk=task_id)
        .first()
    )

    if task is None:
        raise NotFound(
            "Task not found."
        )

    _ensure_project_active(
        task.project
    )

    is_admin = _is_project_admin(
        project=task.project,
        user=requesting_user,
    )

    is_assignee = (
        task.assigned_to_id
        == requesting_user.id
        and _is_active_project_member(
            project=task.project,
            user=requesting_user,
        )
    )

    if not is_admin and not is_assignee:
        raise PermissionDenied(
            "Only the task assignee or Project Admin "
            "can update task status."
        )

    # Idempotent request.
    if task.status == new_status:
        return task, True

    allowed_transitions = {
        Task.Status.TODO: {
            Task.Status.IN_PROGRESS,
        },
        Task.Status.IN_PROGRESS: {
            Task.Status.DONE,
        },
        Task.Status.DONE: set(),
    }

    allowed = allowed_transitions.get(
        task.status,
        set(),
    )

    if new_status not in allowed:
        raise serializers.ValidationError(
            {
                "status": (
                    f"Invalid task status transition: "
                    f"{task.status} -> {new_status}."
                )
            }
        )

    task.status = new_status

    if new_status == Task.Status.DONE:
        if task.completed_at is None:
            task.completed_at = timezone.now()

    task.save(
        update_fields=[
            "status",
            "completed_at",
            "updated_at",
        ]
    )

    return task, False


def get_my_tasks(
    requesting_user,
):
    """
    Only tasks assigned to logged-in user,
    where user still has ACTIVE project membership.
    """

    return (
        Task.objects
        .filter(
            assigned_to=requesting_user,
            project__project_members__user=requesting_user,
            project__project_members__status=(
                ProjectMember.Status.ACTIVE
            ),
        )
        .select_related(
            "project",
            "assigned_to",
            "created_by",
        )
        .distinct()
        .order_by(
            "status",
            "due_date",
            "-created_at",
        )
    )