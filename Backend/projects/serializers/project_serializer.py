from rest_framework import serializers


class ProjectSerializer(serializers.Serializer):
    """Serialize project data for API responses."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    key = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    is_archived = serializers.BooleanField()
    owner_id = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
