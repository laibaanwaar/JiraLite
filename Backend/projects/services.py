import logging

from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework import serializers
from rest_framework.exceptions import (
    NotFound,
    PermissionDenied,
)

from .models import Project, ProjectMember


logger = logging.getLogger(__name__)


def get_accessible_projects(user):
    """
    Return only projects accessible to logged-in user.

    Accessible means:
    1. User created the project
    OR
    2. User has an ACTIVE ProjectMember record.
    """

    return (
        Project.objects
        .filter(
            Q(created_by=user)
            | Q(
                project_members__user=user,
                project_members__status=(
                    ProjectMember.Status.ACTIVE
                ),
            )
        )
        .select_related(
            "created_by",
        )
        .prefetch_related(
            "project_members",
        )
        .distinct()
        .order_by("-created_at")
    )


def get_accessible_project_or_404(
    user,
    project_id,
):
    """
    Prevent unauthorized users from discovering
    projects that they cannot access.
    """

    project = (
        get_accessible_projects(user)
        .filter(pk=project_id)
        .first()
    )

    if project is None:
        raise NotFound(
            (
                "Project not found or you do not "
                "have access to this project."
            )
        )

    return project


def ensure_project_admin(
    user,
    project,
):
    """
    Only an ACTIVE ADMIN of this specific project
    can edit/archive it.
    """

    is_admin = ProjectMember.objects.filter(
        project=project,
        user=user,
        role=ProjectMember.Role.ADMIN,
        status=ProjectMember.Status.ACTIVE,
    ).exists()

    if not is_admin:
        raise PermissionDenied(
            (
                "Only the Project Admin can "
                "perform this action."
            )
        )


@transaction.atomic
def create_project_with_admin(
    user,
    validated_data,
):
    """
    Project + Admin membership are created
    in one transaction.

    If membership creation fails,
    project creation also rolls back.
    """

    try:
        project = Project.objects.create(
            created_by=user,
            **validated_data,
        )

        ProjectMember.objects.create(
            project=project,
            user=user,
            role=ProjectMember.Role.ADMIN,
            status=ProjectMember.Status.ACTIVE,
        )

        return project

    except IntegrityError as exc:
        logger.exception(
            "Project creation integrity error."
        )

        raise serializers.ValidationError(
            {
                "detail": (
                    "Unable to create project because "
                    "the provided data conflicts with "
                    "an existing record."
                )
            }
        ) from exc


@transaction.atomic
def update_project(
    project,
    validated_data,
):
    """
    Safely update project.
    """

    if project.status == Project.Status.ARCHIVED:
        raise serializers.ValidationError(
            {
                "detail": (
                    "Archived projects cannot be modified."
                )
            }
        )

    try:
        for field, value in validated_data.items():
            setattr(
                project,
                field,
                value,
            )

        project.save()

        return project

    except IntegrityError as exc:
        logger.exception(
            "Project update integrity error."
        )

        raise serializers.ValidationError(
            {
                "detail": (
                    "Unable to update project because "
                    "the provided data conflicts with "
                    "an existing record."
                )
            }
        ) from exc


@transaction.atomic
def archive_project(project):
    """
    DELETE endpoint uses soft delete/archive.

    This preserves project history and future
    tasks/invitations instead of physically
    deleting all related records.
    """

    if project.status == Project.Status.ARCHIVED:
        # Idempotent:
        # repeated DELETE does not break anything.
        return project

    project.status = Project.Status.ARCHIVED

    project.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )

    return project