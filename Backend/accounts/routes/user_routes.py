from django.urls import path

from accounts.views import CreateUserView, UserListView, UserDetailView

urlpatterns = [
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/", CreateUserView.as_view(), name="user-create"),
    path("users/<int:user_id>/", UserDetailView.as_view(), name="user-detail"),
]
