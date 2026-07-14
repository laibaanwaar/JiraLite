from rest_framework import serializers

from projects.serializers.project_detail_serializer import ProjectDetailSerializer
from projects.serializers.project_owner_serializer import ProjectOwnerSerializer


class TaskSerializer(serializers.Serializer):
    """Serialize task data for API responses."""

    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    priority = serializers.CharField()
    status = serializers.CharField()
    due_date = serializers.DateField(allow_null=True)
    project = ProjectDetailSerializer()
    assigned_to = ProjectOwnerSerializer()
    created_by = ProjectOwnerSerializer()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
