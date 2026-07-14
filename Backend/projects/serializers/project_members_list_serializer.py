from rest_framework import serializers

from projects.serializers.project_detail_serializer import ProjectDetailSerializer
from projects.serializers.project_owner_serializer import ProjectOwnerSerializer


class AssignedProjectMemberSerializer(serializers.Serializer):
    """Serialize assigned project member data for list responses."""

    id = serializers.IntegerField()
    user = ProjectOwnerSerializer()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class ProjectMembersListSerializer(serializers.Serializer):
    """Serialize project member list responses."""

    project = ProjectDetailSerializer()
    members = AssignedProjectMemberSerializer(many=True)
