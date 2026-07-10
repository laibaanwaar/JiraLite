from django.urls import path

from accounts.views import DeactivateRoleView, RoleDetailView, RoleListView

urlpatterns = [
    path("roles/", RoleListView.as_view(), name="role-list"),
    path("roles/<role_id>/", RoleDetailView.as_view(), name="role-detail"),
    path("roles/<role_id>/deactivate/", DeactivateRoleView.as_view(), name="role-deactivate"),
]
