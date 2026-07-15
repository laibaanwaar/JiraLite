from rest_framework import serializers


class RoleDashboardSerializer(serializers.Serializer):
    """Serialize role dashboard statistics."""

    total_roles = serializers.IntegerField()
    active_roles = serializers.IntegerField()
    inactive_roles = serializers.IntegerField()
