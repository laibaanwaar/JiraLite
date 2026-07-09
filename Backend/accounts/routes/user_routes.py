from django.urls import path

from accounts.views import CreateUserView, UserDeactivateView, UserListView, UserDetailView

urlpatterns = [
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/", CreateUserView.as_view(), name="user-create"),
    path("users/<user_id>/", UserDetailView.as_view(), name="user-detail"),
    path("users/<user_id>/deactivate/", UserDeactivateView.as_view(), name="user-deactivate"),
]
