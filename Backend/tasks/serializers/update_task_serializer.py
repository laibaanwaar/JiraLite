from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from tasks.models.task import Task


class UpdateTaskSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, max_length=150, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    priority = serializers.ChoiceField(required=False, choices=[choice[0] for choice in Task.PRIORITY_CHOICES])
    status = serializers.ChoiceField(required=False, choices=[choice[0] for choice in Task.STATUS_CHOICES])
    due_date = serializers.DateField(required=False, allow_null=True)
    assigned_to_id = serializers.IntegerField(required=False, allow_null=False)

    allowed_fields = {"title", "description", "priority", "status", "due_date", "assigned_to_id"}

    def validate(self, attrs):
        provided_fields = set(getattr(self.initial_data, "keys", lambda: [])())
        if not provided_fields:
            raise serializers.ValidationError(_("At least one field must be provided."))

        invalid_fields = sorted(provided_fields - self.allowed_fields)
        if invalid_fields:
            raise serializers.ValidationError(
                _("Only title, description, priority, status, due_date, and assigned_to_id can be provided.")
            )
        return attrs

    def validate_title(self, value):
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError(_("Title cannot be empty."))
        return stripped

    def validate_description(self, value):
        return value.strip() if isinstance(value, str) else ""

    def validate_assigned_to_id(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError(_("A valid assigned user ID is required."))
        return value
