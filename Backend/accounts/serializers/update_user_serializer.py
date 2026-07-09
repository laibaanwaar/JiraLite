from django.utils.translation import gettext_lazy as _
from rest_framework import serializers


class UpdateUserSerializer(serializers.Serializer):
    """Validate and sanitize the user update request payload."""

    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    role_id = serializers.IntegerField(required=False, allow_null=True)

    allowed_fields = {"first_name", "last_name", "email", "role_id"}

    def validate(self, attrs):
        provided_fields = set(getattr(self.initial_data, "keys", lambda: [])())

        invalid_fields = sorted(provided_fields - self.allowed_fields)
        if invalid_fields:
            raise serializers.ValidationError(
                _("Only first_name, last_name, email, and role_id can be updated.")
            )

        if not attrs:
            raise serializers.ValidationError(_("At least one field must be provided."))

        return attrs

    def validate_first_name(self, value):
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError(_("First name is required."))
        return stripped

    def validate_last_name(self, value):
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError(_("Last name is required."))
        return stripped

    def validate_email(self, value):
        normalized = value.strip().lower()
        if not normalized:
            raise serializers.ValidationError(_("Email is required."))
        return normalized

    def validate_role_id(self, value):
        if value is None:
            raise serializers.ValidationError(_("Role is required."))
        if value <= 0:
            raise serializers.ValidationError(_("A valid role ID is required."))
        return value
