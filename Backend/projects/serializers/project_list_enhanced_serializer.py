from rest_framework import serializers

from projects.serializers.project_list_serializer import ProjectListSerializer


class ProjectMemberSummarySerializer(serializers.Serializer):
    """Serialize a slim project member payload for list responses."""

    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class ProjectListEnhancedSerializer(ProjectListSerializer):
    """Serialize enriched project list data for API responses."""

    status = serializers.CharField()
    members_count = serializers.IntegerField()
    members = ProjectMemberSummarySerializer(many=True)
    completion_percentage = serializers.FloatField()
