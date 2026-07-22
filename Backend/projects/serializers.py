import re

from rest_framework import serializers

from .models import Project, ProjectMember


class ProjectSerializer(serializers.ModelSerializer):

    created_by = serializers.SerializerMethodField(
        read_only=True,
    )

    current_user_role = serializers.SerializerMethodField(
        read_only=True,
    )

    class Meta:
        model = Project

        fields = [
            "id",
            "name",
            "project_key",
            "description",
            "created_by",
            "current_user_role",
            "start_date",
            "end_date",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "current_user_role",
            "created_at",
            "updated_at",
        ]

    def get_created_by(self, obj):
        return {
            "id": obj.created_by_id,
            "first_name": obj.created_by.first_name,
            "last_name": obj.created_by.last_name,
            "email": obj.created_by.email,
        }

    def get_current_user_role(self, obj):
        request = self.context.get("request")

        if (
            request is None
            or not request.user.is_authenticated
        ):
            return None

        membership = (
            obj.project_members
            .filter(
                user=request.user,
                status=ProjectMember.Status.ACTIVE,
            )
            .first()
        )

        if membership:
            return membership.role

        return None

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Project name cannot be empty."
            )

        if len(value) < 3:
            raise serializers.ValidationError(
                "Project name must contain at least 3 characters."
            )

        return value

    def validate_project_key(self, value):
        value = value.strip().upper()

        if not re.fullmatch(
            r"[A-Z][A-Z0-9_-]{1,19}",
            value,
        ):
            raise serializers.ValidationError(
                (
                    "Project key must start with a letter and "
                    "contain only uppercase letters, numbers, "
                    "hyphens, or underscores."
                )
            )

        queryset = Project.objects.filter(
            project_key__iexact=value
        )

        # PATCH request:
        # do not treat current project's key as duplicate.
        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "A project with this key already exists."
            )

        return value

    def validate(self, attrs):
        start_date = attrs.get(
            "start_date",
            self.instance.start_date
            if self.instance
            else None,
        )

        end_date = attrs.get(
            "end_date",
            self.instance.end_date
            if self.instance
            else None,
        )

        if (
            start_date
            and end_date
            and end_date < start_date
        ):
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "End date cannot be before start date."
                    )
                }
            )

        return attrs