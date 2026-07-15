from django.urls import path

from accounts.views import UserActivateView, UserDashboardView, UserDeactivateView, UserListView, UserDetailView

urlpatterns = [
    path("users/dashboard/", UserDashboardView.as_view(), name="user-dashboard"),
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/<user_id>/activate/", UserActivateView.as_view(), name="user-activate"),
    path("users/<user_id>/", UserDetailView.as_view(), name="user-detail"),
    path("users/<user_id>/deactivate/", UserDeactivateView.as_view(), name="user-deactivate"),
]
