from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ProjectSerializer
from .services import (
    archive_project,
    create_project_with_admin,
    ensure_project_admin,
    get_accessible_project_or_404,
    get_accessible_projects,
    update_project,
)


class ProjectListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        GET /api/projects/

        Return only projects accessible
        to the logged-in user.
        """

        projects = get_accessible_projects(
            request.user
        )

        serializer = ProjectSerializer(
            projects,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "message": (
                    "Projects retrieved successfully."
                ),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        """
        POST /api/projects/

        Any authenticated user can create a project.

        Creator automatically becomes ADMIN
        of that specific project.
        """

        serializer = ProjectSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True,
        )

        project = create_project_with_admin(
            user=request.user,
            validated_data=serializer.validated_data,
        )

        response_serializer = ProjectSerializer(
            project,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "message": (
                    "Project created successfully."
                ),
                "data": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class ProjectDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(
        self,
        request,
        project_id,
    ):
        """
        GET /api/projects/{project_id}/

        Admin and active project members can view.
        """

        project = get_accessible_project_or_404(
            user=request.user,
            project_id=project_id,
        )

        serializer = ProjectSerializer(
            project,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "message": (
                    "Project retrieved successfully."
                ),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(
        self,
        request,
        project_id,
    ):
        """
        PATCH /api/projects/{project_id}/

        Only Project ADMIN can update.
        """

        project = get_accessible_project_or_404(
            user=request.user,
            project_id=project_id,
        )

        ensure_project_admin(
            user=request.user,
            project=project,
        )

        serializer = ProjectSerializer(
            project,
            data=request.data,
            partial=True,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True,
        )

        project = update_project(
            project=project,
            validated_data=serializer.validated_data,
        )

        response_serializer = ProjectSerializer(
            project,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "message": (
                    "Project updated successfully."
                ),
                "data": response_serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(
        self,
        request,
        project_id,
    ):
        """
        DELETE /api/projects/{project_id}/

        Only Project ADMIN can archive/delete.
        """

        project = get_accessible_project_or_404(
            user=request.user,
            project_id=project_id,
        )

        ensure_project_admin(
            user=request.user,
            project=project,
        )

        archive_project(
            project
        )

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )