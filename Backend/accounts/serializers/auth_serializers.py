from django.utils.translation import gettext_lazy as _
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    """Validate login payload."""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        if not value.strip():
            raise serializers.ValidationError(_("Email is required."))
        return value.strip().lower()

    def validate_password(self, value):
        if not value.strip():
            raise serializers.ValidationError(_("Password is required."))
        return value


class RefreshTokenSerializer(serializers.Serializer):
    """Validate refresh token payload."""

    refresh = serializers.CharField(
        required=True,
        allow_null=True,
        write_only=True,
        trim_whitespace=False,
    )

    def validate_refresh(self, value):
        if value is None:
            raise serializers.ValidationError(_("Refresh token is required."))

        if not value.strip():
            raise serializers.ValidationError(_("Refresh token is required."))
        return value.strip()


class LogoutSerializer(serializers.Serializer):
    """Validate logout payload."""

    refresh = serializers.CharField(
        required=True,
        allow_null=True,
        write_only=True,
        trim_whitespace=False,
    )

    def validate_refresh(self, value):
        if value is None:
            raise serializers.ValidationError(_("Refresh token is required."))

        if not value.strip():
            raise serializers.ValidationError(_("Refresh token is required."))
        return value.strip()
