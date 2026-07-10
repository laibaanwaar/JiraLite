from rest_framework import serializers


class RoleSerializer(serializers.Serializer):
    """Serialize role data for API responses."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    code = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    is_active = serializers.BooleanField()
    users_count = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
