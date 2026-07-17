from rest_framework import serializers

from projects.models import Task


class TaskStatusResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES)
    completed_at = serializers.DateTimeField(required=False, allow_null=True)


class TaskStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES)
    completed_at = serializers.DateTimeField(required=False, allow_null=True)
