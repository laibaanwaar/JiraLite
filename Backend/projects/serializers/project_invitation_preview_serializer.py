from rest_framework import serializers


class ProjectInvitationPreviewSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=512)

    def validate_token(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("Invitation token is required.")
        return normalized
