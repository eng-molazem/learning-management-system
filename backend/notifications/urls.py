from django.urls import path

from . import views

urlpatterns = [
    path("me", views.MyNotificationsView.as_view()),
    path("unread-count", views.UnreadCountView.as_view()),
    path("<str:notification_id>/read", views.MarkReadView.as_view()),
    path("read-all", views.MarkAllReadView.as_view()),
]
