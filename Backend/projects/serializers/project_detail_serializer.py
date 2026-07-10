from rest_framework import serializers

from projects.serializers.project_list_serializer import ProjectListSerializer


class ProjectDetailSerializer(ProjectListSerializer):
    is_archived = serializers.BooleanField()
