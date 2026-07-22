from django.urls import path

from .task_views import (
    MyTaskListAPIView,
    ProjectTaskListCreateAPIView,
    TaskDetailAPIView,
    TaskStatusUpdateAPIView,
)


urlpatterns = [
    path(
        "projects/<int:project_id>/tasks/",
        ProjectTaskListCreateAPIView.as_view(),
        name="project-task-list-create",
    ),

    path(
        "tasks/<int:task_id>/status/",
        TaskStatusUpdateAPIView.as_view(),
        name="task-status-update",
    ),

    path(
        "tasks/<int:task_id>/",
        TaskDetailAPIView.as_view(),
        name="task-detail",
    ),

    path(
        "my-tasks/",
        MyTaskListAPIView.as_view(),
        name="my-task-list",
    ),
]