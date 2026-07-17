from django.urls import path

from projects.views import (
    MyTasksView,
    ProjectTaskListView,
    TaskCommentDetailView,
    TaskCommentListView,
    TaskDetailView,
    TaskListView,
)


urlpatterns = [
    path("projects/<int:project_id>/tasks/", ProjectTaskListView.as_view(), name="project-task-list"),
    path("my-tasks/", MyTasksView.as_view(), name="my-task-list"),
    path("tasks/", TaskListView.as_view(), name="task-list"),
    path("tasks/my/", MyTasksView.as_view(), name="task-my-list"),
    path("tasks/<int:task_id>/comments/", TaskCommentListView.as_view(), name="task-comment-list"),
    path("task-comments/<int:comment_id>/", TaskCommentDetailView.as_view(), name="task-comment-detail"),
    path("tasks/<int:task_id>/", TaskDetailView.as_view(), name="task-detail"),
]
