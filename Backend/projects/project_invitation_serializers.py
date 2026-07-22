from rest_framework import serializers

from .models import ProjectInvitation


class SendProjectInvitationsSerializer(serializers.Serializer):
    """
    Accept multiple email addresses.

    Example:
    {
        "emails": [
            "sara@example.com",
            "ahmed@example.com"
        ]
    }
    """

    emails = serializers.ListField(
        child=serializers.EmailField(),
        allow_empty=False,
        max_length=50,
    )

    def validate_emails(self, values):
        normalized_emails = []
        seen = set()

        for email in values:
            normalized = email.strip().lower()

            # Remove duplicates from same request.
            if normalized not in seen:
                seen.add(normalized)
                normalized_emails.append(normalized)

        if not normalized_emails:
            raise serializers.ValidationError(
                "At least one valid email address is required."
            )

        return normalized_emails


class ProjectInvitationSerializer(serializers.ModelSerializer):

    project = serializers.SerializerMethodField()
    invited_by = serializers.SerializerMethodField()

    class Meta:
        model = ProjectInvitation

        fields = [
            "id",
            "project",
            "invited_by",
            "status",
            "expires_at",
            "created_at",
            "responded_at",
        ]

        read_only_fields = fields

    def get_project(self, obj):
        return {
            "id": obj.project_id,
            "name": obj.project.name,
            "project_key": obj.project.project_key,
        }

    def get_invited_by(self, obj):
        return {
            "id": obj.invited_by_id,
            "first_name": obj.invited_by.first_name,
            "last_name": obj.invited_by.last_name,
            "email": obj.invited_by.email,
        }