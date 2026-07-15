from django.urls import path

from accounts.views import DeactivateRoleView, RoleDashboardView, RoleDetailView, RoleListView

urlpatterns = [
    path("roles/dashboard/", RoleDashboardView.as_view(), name="role-dashboard"),
    path("roles/", RoleListView.as_view(), name="role-list"),
    path("roles/<role_id>/", RoleDetailView.as_view(), name="role-detail"),
    path("roles/<role_id>/deactivate/", DeactivateRoleView.as_view(), name="role-deactivate"),
]
