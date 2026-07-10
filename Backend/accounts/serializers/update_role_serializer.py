from django.utils.translation import gettext_lazy as _
from rest_framework import serializers


class UpdateRoleSerializer(serializers.Serializer):
    """Validate and sanitize update role requests."""

    name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    code = serializers.SlugField(required=False, allow_blank=True, max_length=50)
    description = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)

    allowed_fields = {"name", "code", "description", "is_active"}

    def validate(self, attrs):
        provided_fields = set(getattr(self.initial_data, "keys", lambda: [])())
        invalid_fields = sorted(provided_fields - self.allowed_fields)
        if invalid_fields:
            raise serializers.ValidationError(
                _("Only name, code, description, and is_active can be updated.")
            )

        if not attrs:
            raise serializers.ValidationError(_("At least one field must be provided."))

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
