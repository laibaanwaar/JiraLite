import logging
from typing import Any, cast

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.db import DatabaseError, IntegrityError, OperationalError, transaction

from projects.models.project import Project
from projects.models.project_member import ProjectMember


logger = logging.getLogger(__name__)
User = get_user_model()


class ProjectMemberService:
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
            "role": ProjectMemberService._build_role_payload(user.role),
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
            "owner": ProjectMemberService._build_user_payload(project.owner),
            "created_at": project.created_at,
            "updated_at": project.updated_at,
        }

    @staticmethod
    def _build_project_member_payload(project_member: Any) -> dict:
        return {
            "id": project_member.id,
            "project": ProjectMemberService._build_project_payload(project_member.project),
            "user": ProjectMemberService._build_user_payload(project_member.user),
            "created_at": project_member.created_at,
            "updated_at": project_member.updated_at,
        }

    @staticmethod
    def _build_assigned_member_payload(project_member: Any) -> dict:
        return {
            "id": project_member.user.id,
            "first_name": project_member.user.first_name,
            "last_name": project_member.user.last_name,
            "email": project_member.user.email,
        }

    @staticmethod
    def _build_project_member_list_project_payload(project: Any) -> dict:
        return {
            "id": project.id,
            "name": project.name,
        }

    @staticmethod
    def _merge_owner_into_members(*, project: Any, members: list[dict]) -> list[dict]:
        owner_payload = {
            "id": project.owner.id,
            "first_name": project.owner.first_name,
            "last_name": project.owner.last_name,
            "email": project.owner.email,
        }
        member_ids = {member["id"] for member in members}

        if owner_payload["id"] in member_ids:
            return members

        return [owner_payload, *members]

    @staticmethod
    def _validate_project_id(project_id: int) -> dict:
        try:
            project_value = int(project_id)
        except (TypeError, ValueError):
            return {
                "success": False,
                "error": {
                    "code": "invalid_project_id",
                    "message": "Invalid project ID.",
                },
            }

        if project_value <= 0:
            return {
                "success": False,
                "error": {
                    "code": "invalid_project_id",
                    "message": "Invalid project ID.",
                },
            }

        return {"success": True, "value": project_value}

    @staticmethod
    def _validate_user_id(user_id: int) -> dict:
        try:
            user_value = int(user_id)
        except (TypeError, ValueError):
            return {
                "success": False,
                "error": {
                    "code": "invalid_user_id",
                    "message": "Invalid user ID.",
                },
            }

        if user_value <= 0:
            return {
                "success": False,
                "error": {
                    "code": "invalid_user_id",
                    "message": "Invalid user ID.",
                },
            }

        return {"success": True, "value": user_value}

    @staticmethod
    def _get_project(*, project_id: int, for_update: bool) -> dict:
        queryset = cast(Any, Project.objects).select_related("owner", "owner__role")
        if for_update:
            queryset = queryset.select_for_update()

        try:
            project = queryset.get(pk=project_id)
        except ObjectDoesNotExist:
            return {
                "success": False,
                "code": "project_not_found",
                "message": "Project not found.",
            }

        if project.is_archived:
            return {
                "success": False,
                "code": "project_inactive",
                "message": "Inactive projects cannot be modified.",
            }

        return {"success": True, "data": project}

    @staticmethod
    def _get_user(*, user_id: int, for_update: bool) -> dict:
        queryset = cast(Any, User.objects).select_related("role")
        if for_update:
            queryset = queryset.select_for_update()

        try:
            user = queryset.get(pk=user_id)
        except ObjectDoesNotExist:
            return {
                "success": False,
                "code": "user_not_found",
                "message": "User not found.",
            }

        if not user.is_active:
            return {
                "success": False,
                "code": "user_inactive",
                "message": "Inactive users cannot be assigned to or removed from a project.",
            }

        return {"success": True, "data": user}

    @staticmethod
    def create_project_member(*, project_id: int, user_id: int) -> dict:
        project_id_result = ProjectMemberService._validate_project_id(project_id)
        if not project_id_result["success"]:
            return {"success": False, **project_id_result["error"]}

        user_id_result = ProjectMemberService._validate_user_id(user_id)
        if not user_id_result["success"]:
            return {"success": False, **user_id_result["error"]}

        project_value = project_id_result["value"]
        user_value = user_id_result["value"]

        try:
            with cast(Any, transaction).atomic():
                project_result = ProjectMemberService._get_project(
                    project_id=project_value,
                    for_update=True,
                )
                if not project_result["success"]:
                    if project_result["code"] == "project_inactive":
                        project_result["message"] = "Inactive projects cannot accept new members."
                    return project_result

                user_result = ProjectMemberService._get_user(
                    user_id=user_value,
                    for_update=True,
                )
                if not user_result["success"]:
                    if user_result["code"] == "user_inactive":
                        user_result["message"] = "Inactive users cannot be assigned to a project."
                    return user_result

                project = project_result["data"]
                user = user_result["data"]

                if cast(Any, ProjectMember.objects).filter(
                    project_id=project.pk,
                    user_id=user.pk,
                ).exists():
                    return {
                        "success": False,
                        "code": "duplicate_assignment",
                        "message": "This user is already assigned to the project.",
                    }

                project_member = cast(Any, ProjectMember.objects).create(
                    project=project,
                    user=user,
                )

                return {
                    "success": True,
                    "message": "Project member assigned successfully.",
                    "data": ProjectMemberService._build_project_member_payload(project_member),
                }
        except IntegrityError:
            logger.warning(
                "Project member uniqueness race condition caught for project %s and user %s.",
                project_value,
                user_value,
            )
            return {
                "success": False,
                "code": "duplicate_assignment",
                "message": "This user is already assigned to the project.",
            }
        except (DatabaseError, OperationalError):
            logger.exception(
                "Database error while assigning user %s to project %s.",
                user_value,
                project_value,
            )
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
        except Exception:
            logger.exception(
                "Unexpected error while assigning user %s to project %s.",
                user_value,
                project_value,
            )
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

    @staticmethod
    def list_project_members(*, project_id: int) -> dict:
        project_id_result = ProjectMemberService._validate_project_id(project_id)
        if not project_id_result["success"]:
            return {"success": False, **project_id_result["error"]}

        project_value = project_id_result["value"]

        try:
            project_result = ProjectMemberService._get_project(
                project_id=project_value,
                for_update=False,
            )
            if not project_result["success"]:
                if project_result["code"] == "project_inactive":
                    project_result["message"] = "Inactive projects cannot be viewed."
                return project_result

            project = project_result["data"]
            members = (
                cast(Any, ProjectMember.objects)
                .filter(project_id=project.pk)
                .select_related("user", "user__role")
                .order_by("user__email")
            )

            return {
                "success": True,
                "message": "Project members retrieved successfully.",
                "data": {
                    "project": ProjectMemberService._build_project_member_list_project_payload(project),
                    "members": ProjectMemberService._merge_owner_into_members(
                        project=project,
                        members=[
                            ProjectMemberService._build_assigned_member_payload(project_member)
                            for project_member in members
                        ],
                    ),
                },
            }
        except (DatabaseError, OperationalError):
            logger.exception("Database error while retrieving members for project %s.", project_value)
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
        except Exception:
            logger.exception("Unexpected error while retrieving members for project %s.", project_value)
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }

    @staticmethod
    def remove_project_member(*, project_id: int, user_id: int) -> dict:
        project_id_result = ProjectMemberService._validate_project_id(project_id)
        if not project_id_result["success"]:
            return {"success": False, **project_id_result["error"]}

        user_id_result = ProjectMemberService._validate_user_id(user_id)
        if not user_id_result["success"]:
            return {"success": False, **user_id_result["error"]}

        project_value = project_id_result["value"]
        user_value = user_id_result["value"]

        try:
            with cast(Any, transaction).atomic():
                project_result = ProjectMemberService._get_project(
                    project_id=project_value,
                    for_update=True,
                )
                if not project_result["success"]:
                    return project_result

                user_result = ProjectMemberService._get_user(
                    user_id=user_value,
                    for_update=True,
                )
                if not user_result["success"]:
                    if user_result["code"] == "user_inactive":
                        user_result["message"] = "Inactive users cannot be removed from a project."
                    return user_result

                project = project_result["data"]
                user = user_result["data"]

                if project.owner_id == user.pk:
                    return {
                        "success": False,
                        "code": "owner_removal_forbidden",
                        "message": "The project owner cannot be removed from the project.",
                    }

                try:
                    project_member = cast(Any, ProjectMember.objects).get(
                        project_id=project.pk,
                        user_id=user.pk,
                    )
                except ObjectDoesNotExist:
                    return {
                        "success": False,
                        "code": "membership_not_found",
                        "message": "Project membership not found.",
                    }

                payload = ProjectMemberService._build_project_member_payload(project_member)
                project_member.delete()

                return {
                    "success": True,
                    "message": "Project member removed successfully.",
                    "data": payload,
                }
        except (DatabaseError, OperationalError):
            logger.exception(
                "Database error while removing user %s from project %s.",
                user_value,
                project_value,
            )
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
        except Exception:
            logger.exception(
                "Unexpected error while removing user %s from project %s.",
                user_value,
                project_value,
            )
            return {
                "success": False,
                "code": "server_error",
                "message": "A server error occurred. Please try again later.",
            }
