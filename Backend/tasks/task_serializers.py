from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Task


User = get_user_model()


class CreateTaskSerializer(serializers.Serializer):
    title = serializers.CharField(
        max_length=200,
    )

    description = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )

    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
    )

    priority = serializers.ChoiceField(
        choices=Task.Priority.choices,
        default=Task.Priority.MEDIUM,
    )

    due_date = serializers.DateField(
        required=False,
        allow_null=True,
    )

    def validate_title(self, value):
        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                "Task title must contain at least 3 characters."
            )

        return value


class UpdateTaskSerializer(serializers.Serializer):
    title = serializers.CharField(
        max_length=200,
        required=False,
    )

    description = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
    )

    priority = serializers.ChoiceField(
        choices=Task.Priority.choices,
        required=False,
    )

    due_date = serializers.DateField(
        required=False,
        allow_null=True,
    )

    def validate_title(self, value):
        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                "Task title must contain at least 3 characters."
            )

        return value


class TaskStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=Task.Status.choices,
    )


class TaskSerializer(serializers.ModelSerializer):
    project = serializers.SerializerMethodField()
    assigned_to = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "project",
            "assigned_to",
            "created_by",
            "priority",
            "status",
            "due_date",
            "created_at",
            "updated_at",
            "completed_at",
        ]

        read_only_fields = fields

    def get_project(self, obj):
        return {
            "id": obj.project_id,
            "name": obj.project.name,
            "project_key": obj.project.project_key,
        }

    def get_assigned_to(self, obj):
        return {
            "id": obj.assigned_to_id,
            "first_name": obj.assigned_to.first_name,
            "last_name": obj.assigned_to.last_name,
            "email": obj.assigned_to.email,
        }

    def get_created_by(self, obj):
        return {
            "id": obj.created_by_id,
            "first_name": obj.created_by.first_name,
            "last_name": obj.created_by.last_name,
            "email": obj.created_by.email,
        }