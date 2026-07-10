from django.utils.translation import gettext_lazy as _
from rest_framework import serializers


class UpdateProjectSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, max_length=150, allow_blank=True)
    key = serializers.CharField(required=False, max_length=50, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    owner_id = serializers.IntegerField(required=False, allow_null=False)

    allowed_fields = {"name", "key", "description", "owner_id"}

    def validate(self, attrs):
        provided_fields = set(getattr(self.initial_data, "keys", lambda: [])())
        if not provided_fields:
            raise serializers.ValidationError(_("At least one field must be provided."))

        invalid_fields = sorted(provided_fields - self.allowed_fields)
        if invalid_fields:
            raise serializers.ValidationError(
                _("Only name, key, description, and owner_id can be provided.")
            )
        return attrs

    def validate_name(self, value):
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError(_("Name cannot be empty."))
        return stripped

    def validate_key(self, value):
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError(_("Key cannot be empty."))
        return stripped

    def validate_description(self, value):
        return value.strip() if isinstance(value, str) else ""

    def validate_owner_id(self, value):
        if value is None:
            raise serializers.ValidationError(_("Owner ID is required."))
        if value <= 0:
            raise serializers.ValidationError(_("A valid owner ID is required."))
        return value
