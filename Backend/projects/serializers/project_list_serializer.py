from rest_framework import serializers

from projects.models import ProjectMember


def build_project_permissions(role: str) -> dict:
    if role == ProjectMember.ROLE_OWNER:
        return {
            "can_view": True,
            "can_edit": True,
            "can_delete": True,
            "can_invite_users": True,
            "can_manage_members": True,
            "can_create_task": True,
        }
    if role == ProjectMember.ROLE_ADMIN:
        return {
            "can_view": True,
            "can_edit": True,
            "can_delete": False,
            "can_invite_users": True,
            "can_manage_members": True,
            "can_create_task": True,
        }
    return {
        "can_view": True,
        "can_edit": False,
        "can_delete": False,
        "can_invite_users": False,
        "can_manage_members": False,
        "can_create_task": False,
    }


class ProjectListSerializer(serializers.Serializer):
    def to_representation(self, instance):
        project = getattr(instance, "project", instance)
        role = getattr(instance, "current_user_role", getattr(instance, "role", None))
        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "current_user_role": role,
            "total_members": getattr(instance, "total_members", 0),
            "total_tasks": getattr(instance, "total_tasks", 0),
            "is_active": project.is_active,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "permissions": build_project_permissions(role),
        }
