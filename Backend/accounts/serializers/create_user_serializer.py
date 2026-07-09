import re

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers


class CreateUserSerializer(serializers.Serializer):
    """Validate and sanitize the create user request payload."""

    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, trim_whitespace=False)
    role_id = serializers.IntegerField(required=True, allow_null=False)

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

        return value

    def validate_role_id(self, value):
        if value is None:
            raise serializers.ValidationError(_("Role is required."))
        if value <= 0:
            raise serializers.ValidationError(_("A valid role ID is required."))
        return value
