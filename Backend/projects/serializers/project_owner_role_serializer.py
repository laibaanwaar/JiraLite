from rest_framework import serializers


class ProjectOwnerRoleSerializer(serializers.Serializer):
    """Serialize the owner's role in project list responses."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    code = serializers.CharField()
    is_active = serializers.BooleanField()
