from rest_framework import serializers

from projects.models import ProjectMember


class ProjectInvitationCreateSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    project_role = serializers.ChoiceField(
        choices=[ProjectMember.ROLE_ADMIN, ProjectMember.ROLE_MEMBER],
        required=False,
    )

    def validate_email(self, value):
        return value.strip().lower()
