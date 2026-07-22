from rest_framework import serializers

from .models import ProjectMember


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = ProjectMember
        fields = [
            "id",
            "user",
            "role",
            "status",
            "joined_at",
        ]
        read_only_fields = fields

    def get_user(self, obj):
        return {
            "id": obj.user_id,
            "first_name": obj.user.first_name,
            "last_name": obj.user.last_name,
            "email": obj.user.email,
        }