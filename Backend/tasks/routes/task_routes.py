from django.urls import path

from tasks.views.create_task_view import CreateTaskView
from tasks.views.update_task_view import UpdateTaskView

urlpatterns = [
    path("tasks/", CreateTaskView.as_view(), name="task-create"),
    path("tasks/", CreateTaskView.as_view(), name="task-list"),
    path("tasks/<task_id>/", UpdateTaskView.as_view(), name="task-detail"),
    path("tasks/<task_id>/", UpdateTaskView.as_view(), name="task-update"),
]
