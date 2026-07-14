from django.utils.translation import gettext_lazy as _
from rest_framework import serializers


class CreateProjectMemberSerializer(serializers.Serializer):
    """Validate and sanitize project member assignment requests."""

    user_id = serializers.IntegerField(required=True, allow_null=False)

    allowed_fields = {"user_id"}

    def validate(self, attrs):
        provided_fields = set(getattr(self.initial_data, "keys", lambda: [])())
        invalid_fields = sorted(provided_fields - self.allowed_fields)
        if invalid_fields:
            raise serializers.ValidationError(_("Only user_id can be provided."))
        return attrs

    def validate_user_id(self, value):
        if value is None:
            raise serializers.ValidationError(_("User ID is required."))
        if value <= 0:
            raise serializers.ValidationError(_("A valid user ID is required."))
        return value
