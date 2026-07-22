from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .project_member_serializers import (
    ProjectMemberSerializer,
)
from .project_member_services import (
    get_project_members,
    remove_project_member,
)


class ProjectMemberListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(
        self,
        request,
        project_id,
    ):
        project, memberships = get_project_members(
            project_id=project_id,
            requesting_user=request.user,
        )

        serializer = ProjectMemberSerializer(
            memberships,
            many=True,
        )

        return Response(
            {
                "message": (
                    "Project members retrieved successfully."
                ),
                "data": {
                    "project_id": project.id,
                    "project_name": project.name,
                    "members": serializer.data,
                },
            },
            status=status.HTTP_200_OK,
        )


class RemoveProjectMemberAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(
        self,
        request,
        project_id,
        user_id,
    ):
        membership, already_inactive = (
            remove_project_member(
                project_id=project_id,
                user_id=user_id,
                requesting_user=request.user,
            )
        )

        message = (
            "Member was already inactive."
            if already_inactive
            else
            "Project member removed successfully."
        )

        return Response(
            {
                "message": message,
                "data": {
                    "user_id": membership.user_id,
                    "status": membership.status,
                },
            },
            status=status.HTTP_200_OK,
        )