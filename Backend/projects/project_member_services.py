from django.db import transaction
from rest_framework.exceptions import (
    APIException,
    NotFound,
    PermissionDenied,
)
from rest_framework import status

from .models import Project, ProjectMember


class ConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "The requested operation conflicts with current data."
    default_code = "conflict"


def _get_project(project_id):
    project = Project.objects.filter(
        pk=project_id
    ).first()

    if project is None:
        raise NotFound("Project not found.")

    return project


def _is_active_project_member(project, user):
    return ProjectMember.objects.filter(
        project=project,
        user=user,
        status=ProjectMember.Status.ACTIVE,
    ).exists()


def _is_project_admin(project, user):
    return ProjectMember.objects.filter(
        project=project,
        user=user,
        role=ProjectMember.Role.ADMIN,
        status=ProjectMember.Status.ACTIVE,
    ).exists()


def ensure_active_project_member(project, user):
    if not _is_active_project_member(
        project=project,
        user=user,
    ):
        raise PermissionDenied(
            "You are not an active member of this project."
        )


def ensure_project_admin(project, user):
    if not _is_project_admin(
        project=project,
        user=user,
    ):
        raise PermissionDenied(
            "Only the Project Admin can perform this action."
        )


def get_project_members(
    project_id,
    requesting_user,
):
    """
    ADMIN and MEMBER can view active members
    of a project they belong to.
    """

    project = _get_project(project_id)

    ensure_active_project_member(
        project=project,
        user=requesting_user,
    )

    memberships = (
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

    return project, memberships


@transaction.atomic
def remove_project_member(
    project_id,
    user_id,
    requesting_user,
):
    """
    Soft-remove a MEMBER by setting status=INACTIVE.

    Prevent:
    - non-admin removal
    - self removal
    - project creator removal
    - ADMIN removal
    - removal while open tasks exist
    """

    project = (
        Project.objects
        .select_for_update()
        .filter(pk=project_id)
        .first()
    )

    if project is None:
        raise NotFound("Project not found.")

    ensure_project_admin(
        project=project,
        user=requesting_user,
    )

    if project.status == Project.Status.ARCHIVED:
        raise ConflictError(
            "Members cannot be modified in an archived project."
        )

    membership = (
        ProjectMember.objects
        .select_for_update()
        .select_related("user")
        .filter(
            project=project,
            user_id=user_id,
        )
        .first()
    )

    if membership is None:
        raise NotFound(
            "This user is not a member of the project."
        )

    # Idempotent removal.
    if membership.status == ProjectMember.Status.INACTIVE:
        return membership, True

    if membership.user_id == requesting_user.id:
        raise ConflictError(
            "You cannot remove yourself from the project."
        )

    if membership.user_id == project.created_by_id:
        raise ConflictError(
            "The project creator cannot be removed."
        )

    if membership.role == ProjectMember.Role.ADMIN:
        raise ConflictError(
            "A Project Admin cannot be removed through this endpoint."
        )

    # Lazy import prevents circular import.
    from tasks.models import Task

    has_open_tasks = Task.objects.filter(
        project=project,
        assigned_to=membership.user,
        status__in=[
            Task.Status.TODO,
            Task.Status.IN_PROGRESS,
        ],
    ).exists()

    if has_open_tasks:
        raise ConflictError(
            "Member has active tasks. Reassign or complete "
            "those tasks before removing the member."
        )

    membership.status = ProjectMember.Status.INACTIVE

    membership.save(
        update_fields=["status"]
    )

    return membership, False