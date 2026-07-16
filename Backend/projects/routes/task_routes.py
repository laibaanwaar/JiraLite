from django.urls import path

from projects.views import MyTasksView, ProjectTaskListView, TaskDetailView, TaskListView


urlpatterns = [
    path("projects/<int:project_id>/tasks/", ProjectTaskListView.as_view(), name="project-task-list"),
    path("tasks/", TaskListView.as_view(), name="task-list"),
    path("tasks/my/", MyTasksView.as_view(), name="task-my-list"),
    path("tasks/<int:task_id>/", TaskDetailView.as_view(), name="task-detail"),
]
