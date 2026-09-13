from django.urls import path

from . import views

urlpatterns = [
    path("register", views.RegisterView.as_view()),
    path("login", views.LoginView.as_view()),
    path("refresh", views.RefreshView.as_view()),
    path("me", views.MeView.as_view()),
    path("me/avatar", views.MeAvatarView.as_view()),
    path("admin/users", views.AdminUsersListView.as_view()),
    path("admin/users/<str:user_id>", views.AdminUserDetailView.as_view()),
    path("admin/instructors/pending", views.AdminPendingInstructorsView.as_view()),
]
