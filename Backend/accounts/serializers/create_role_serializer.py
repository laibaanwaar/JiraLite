from django.utils.translation import gettext_lazy as _
from rest_framework import serializers


class CreateRoleSerializer(serializers.Serializer):
    """Validate and sanitize create role requests."""

    name = serializers.CharField(required=True, max_length=100)
    code = serializers.SlugField(required=True, max_length=50)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    is_active = serializers.BooleanField(required=False, default=True)

    allowed_fields = {"name", "code", "description", "is_active"}

    def validate(self, attrs):
        provided_fields = set(getattr(self.initial_data, "keys", lambda: [])())
        invalid_fields = sorted(provided_fields - self.allowed_fields)
        if invalid_fields:
            raise serializers.ValidationError(
                _("Only name, code, description, and is_active can be provided.")
            )

        return attrs

    def validate_name(self, value):
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError(_("Name is required."))
        return stripped

    def validate_code(self, value):
        stripped = value.strip().lower()
        if not stripped:
            raise serializers.ValidationError(_("Code is required."))
        return stripped

    def validate_description(self, value):
        return value.strip() if isinstance(value, str) else ""
