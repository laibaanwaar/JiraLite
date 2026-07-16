from rest_framework import serializers


class TaskListSerializer(serializers.Serializer):
    def to_representation(self, instance):
        return {
            "id": instance.id,
            "title": instance.title,
            "project": {
                "id": instance.project.id,
                "name": instance.project.name,
            },
            "assignee": {
                "project_member_id": instance.assignee.id,
                "user_id": instance.assignee.user.id,
                "first_name": instance.assignee.user.first_name,
                "last_name": instance.assignee.user.last_name,
                "email": instance.assignee.user.email,
            },
            "priority": instance.priority,
            "status": instance.status,
            "due_date": instance.due_date,
            "created_at": instance.created_at,
        }
