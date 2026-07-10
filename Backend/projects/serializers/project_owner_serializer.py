from rest_framework import serializers

from projects.serializers.project_owner_role_serializer import ProjectOwnerRoleSerializer


class ProjectOwnerSerializer(serializers.Serializer):
    """Serialize project owner data for API responses."""

    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    is_active = serializers.BooleanField()
    role = ProjectOwnerRoleSerializer()
