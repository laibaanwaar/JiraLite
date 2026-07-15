import re

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers


class CreateUserSerializer(serializers.Serializer):
    """Validate and sanitize the create user request payload."""

    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, trim_whitespace=False)
    role_id = serializers.IntegerField(required=True, allow_null=False)
    allowed_fields = {"first_name", "last_name", "email", "password", "role_id"}

    def validate(self, attrs):
        provided_fields = set(getattr(self.initial_data, "keys", lambda: [])())
        invalid_fields = sorted(provided_fields - self.allowed_fields)
        if invalid_fields:
            raise serializers.ValidationError(
                _("Only first_name, last_name, email, password, and role_id can be provided.")
            )
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
        # Normalize: strip whitespace and convert to lowercase.
        normalized = value.strip().lower()
        if not normalized:
            raise serializers.ValidationError(_("Email is required."))
        return normalized

    def validate_password(self, value):
        # Reject passwords made entirely of whitespace.
        if not value.strip():
            raise serializers.ValidationError(_("Password cannot be blank or whitespace only."))

        if len(value) < 8:
            raise serializers.ValidationError(_("Password must be at least 8 characters."))

        # Enforce at least one letter and one digit for basic strength.
        if not re.search(r"[A-Za-z]", value):
            raise serializers.ValidationError(_("Password must contain at least one letter."))

        if not re.search(r"\d", value):
            raise serializers.ValidationError(_("Password must contain at least one digit."))

        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))

        return value

    def validate_role_id(self, value):
        if value is None:
            raise serializers.ValidationError(_("Role is required."))
        if value <= 0:
            raise serializers.ValidationError(_("A valid role ID is required."))
        return value
