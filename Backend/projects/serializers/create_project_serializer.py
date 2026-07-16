from rest_framework import serializers


class CreateProjectSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    description = serializers.CharField(required=False, allow_blank=True, max_length=1000)
    invite_emails = serializers.ListField(
        child=serializers.CharField(max_length=254),
        required=False,
        allow_empty=True,
    )
    message = serializers.CharField(required=False, allow_blank=True, max_length=500)
    restricted_fields = {
        "created_by",
        "owner_id",
        "admin_id",
        "user_id",
        "is_staff",
        "is_superuser",
        "role",
        "current_user_role",
        "is_active",
        "created_at",
        "updated_at",
        "invitation_status",
        "token",
        "token_hash",
        "email_status",
    }

    def to_internal_value(self, data):
        if isinstance(data, dict):
            restricted_keys = sorted(key for key in data.keys() if key in self.restricted_fields)
            if restricted_keys:
                raise serializers.ValidationError(
                    {key: ["This field is not allowed."] for key in restricted_keys}
                )
        return super().to_internal_value(data)

    def validate_name(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("Project name is required.")
        return normalized

    def validate_description(self, value):
        return value.strip()

    def validate_message(self, value):
        return value.strip()
