from rest_framework import serializers

class ProjectMemberProjectSerializer(serializers.Serializer):
    """Serialize minimal project data for project member list responses."""

    id = serializers.IntegerField()
    name = serializers.CharField()


class AssignedProjectMemberSerializer(serializers.Serializer):
    """Serialize minimal member data for assigned-to dropdowns."""

    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()


class ProjectMembersListSerializer(serializers.Serializer):
    """Serialize project member list responses."""

    project = ProjectMemberProjectSerializer()
    members = AssignedProjectMemberSerializer(many=True)
