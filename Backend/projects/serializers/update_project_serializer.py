from rest_framework import serializers


RESTRICTED_UPDATE_FIELDS = {
    "id",
    "created_by",
    "created_by_id",
    "owner",
    "owner_id",
    "role",
    "current_user_role",
    "total_members",
    "total_tasks",
    "created_at",
    "updated_at",
    "permissions",
    "is_active",
}
UPDATE_ALLOWED_FIELDS = {"name", "description"}


class UpdateProjectSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, max_length=150)
    description = serializers.CharField(required=False, allow_blank=True, max_length=1000)

    def validate(self, attrs):
        provided_fields = set(getattr(self, "initial_data", {}).keys())
        restricted_fields = sorted(provided_fields & RESTRICTED_UPDATE_FIELDS)
        if restricted_fields:
            raise serializers.ValidationError(
                {field: ["This field cannot be updated."] for field in restricted_fields}
            )

        unknown_fields = sorted(provided_fields - UPDATE_ALLOWED_FIELDS - RESTRICTED_UPDATE_FIELDS)
        if unknown_fields:
            raise serializers.ValidationError(
                {field: ["This field is not allowed."] for field in unknown_fields}
            )
        return attrs

    def validate_name(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("Project name is required.")
        return normalized

    def validate_description(self, value):
        return value.strip()
