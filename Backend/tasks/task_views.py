from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .task_serializers import (
    CreateTaskSerializer,
    TaskSerializer,
    TaskStatusSerializer,
    UpdateTaskSerializer,
)
from .task_services import (
    create_task,
    delete_task,
    get_accessible_task,
    get_my_tasks,
    get_project_tasks,
    update_task,
    update_task_status,
)


class ProjectTaskListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(
        self,
        request,
        project_id,
    ):
        project, tasks = get_project_tasks(
            project_id=project_id,
            requesting_user=request.user,
        )

        serializer = TaskSerializer(
            tasks,
            many=True,
        )

        return Response(
            {
                "message": (
                    "Project tasks retrieved successfully."
                ),
                "data": {
                    "project_id": project.id,
                    "tasks": serializer.data,
                },
            },
            status=status.HTTP_200_OK,
        )

    def post(
        self,
        request,
        project_id,
    ):
        serializer = CreateTaskSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        task = create_task(
            project_id=project_id,
            requesting_user=request.user,
            validated_data=serializer.validated_data,
        )

        return Response(
            {
                "message": (
                    "Task created successfully."
                ),
                "data": TaskSerializer(
                    task
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class TaskDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(
        self,
        request,
        task_id,
    ):
        task = get_accessible_task(
            task_id=task_id,
            requesting_user=request.user,
        )

        return Response(
            {
                "message": (
                    "Task retrieved successfully."
                ),
                "data": TaskSerializer(
                    task
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(
        self,
        request,
        task_id,
    ):
        serializer = UpdateTaskSerializer(
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        if not serializer.validated_data:
            return Response(
                {
                    "detail": (
                        "At least one editable field "
                        "must be provided."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        task = update_task(
            task_id=task_id,
            requesting_user=request.user,
            validated_data=serializer.validated_data,
        )

        return Response(
            {
                "message": (
                    "Task updated successfully."
                ),
                "data": TaskSerializer(
                    task
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(
        self,
        request,
        task_id,
    ):
        delete_task(
            task_id=task_id,
            requesting_user=request.user,
        )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class TaskStatusUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(
        self,
        request,
        task_id,
    ):
        serializer = TaskStatusSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        task, unchanged = update_task_status(
            task_id=task_id,
            requesting_user=request.user,
            new_status=serializer.validated_data[
                "status"
            ],
        )

        message = (
            "Task already has the requested status."
            if unchanged
            else
            "Task status updated successfully."
        )

        return Response(
            {
                "message": message,
                "data": TaskSerializer(
                    task
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class MyTaskListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tasks = get_my_tasks(
            requesting_user=request.user
        )

        serializer = TaskSerializer(
            tasks,
            many=True,
        )

        return Response(
            {
                "message": (
                    "My tasks retrieved successfully."
                ),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )