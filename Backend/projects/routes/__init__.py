from .dashboard_routes import urlpatterns as dashboard_urlpatterns
from .project_routes import urlpatterns as project_urlpatterns
from .task_routes import urlpatterns as task_urlpatterns

urlpatterns = [*project_urlpatterns, *task_urlpatterns, *dashboard_urlpatterns]
