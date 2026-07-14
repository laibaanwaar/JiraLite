from rest_framework import serializers

from projects.serializers.project_detail_serializer import ProjectDetailSerializer
from projects.serializers.project_owner_serializer import ProjectOwnerSerializer


class ProjectMemberSerializer(serializers.Serializer):
    """Serialize project membership data for API responses."""

    id = serializers.IntegerField()
    project = ProjectDetailSerializer()
    user = ProjectOwnerSerializer()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
