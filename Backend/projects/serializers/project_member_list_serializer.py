from rest_framework import serializers


class ProjectMemberListSerializer(serializers.Serializer):
    def to_representation(self, instance):
        return {
            "project_member_id": instance.id,
            "user_id": instance.user.id,
            "first_name": instance.user.first_name,
            "last_name": instance.user.last_name,
            "email": instance.user.email,
            "role": instance.role,
        }
