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

    def validate_name(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("Project name is required.")
        return normalized
