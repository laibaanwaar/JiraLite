from rest_framework import serializers

from projects.serializers.project_owner_serializer import ProjectOwnerSerializer


class ProjectListSerializer(serializers.Serializer):
    """Serialize project list data for API responses."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    key = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    is_archived = serializers.BooleanField()
    owner_id = serializers.IntegerField()
    owner = ProjectOwnerSerializer()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
