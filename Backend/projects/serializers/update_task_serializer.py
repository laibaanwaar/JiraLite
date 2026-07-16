from rest_framework import serializers

from projects.models import Task


RESTRICTED_UPDATE_FIELDS = {
    "id",
    "project",
    "project_id",
    "created_by",
    "created_by_id",
    "created_at",
    "updated_at",
    "is_active",
}
UPDATE_ALLOWED_FIELDS = {"title", "description", "assignee_id", "priority", "status", "due_date"}


class UpdateTaskSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, max_length=200)
    description = serializers.CharField(required=False, allow_blank=True, max_length=5000)
    assignee_id = serializers.IntegerField(required=False)
    priority = serializers.ChoiceField(required=False, choices=Task.PRIORITY_CHOICES)
    status = serializers.ChoiceField(required=False, choices=Task.STATUS_CHOICES)
    due_date = serializers.DateField(required=False, allow_null=True)

    def validate(self, attrs):
        provided_fields = set(getattr(self, "initial_data", {}).keys())
        restricted_fields = sorted(provided_fields & RESTRICTED_UPDATE_FIELDS)
        if restricted_fields:
            raise serializers.ValidationError(
                {field: ["This field cannot be updated."] for field in restricted_fields}
            )

        unknown_fields = sorted(provided_fields - UPDATE_ALLOWED_FIELDS - RESTRICTED_UPDATE_FIELDS)
        if unknown_fields:
            raise serializers.ValidationError(
                {field: ["This field is not allowed."] for field in unknown_fields}
            )
        return attrs

    def validate_title(self, value):
        if not isinstance(value, str):
            raise serializers.ValidationError("Title must be a string.")
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("Title cannot be blank.")
        return normalized

    def validate_description(self, value):
        if not isinstance(value, str):
            raise serializers.ValidationError("Description must be a string.")
        return value.strip()
