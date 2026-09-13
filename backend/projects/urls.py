from django.urls import path

from . import views

urlpatterns = [
    path("", views.ProjectListCreateView.as_view()),
    path("<str:project_id>", views.ProjectDetailView.as_view()),
    path("<str:project_id>/upload", views.ProjectFileUploadView.as_view()),
    path("<str:project_id>/download", views.ProjectDownloadView.as_view()),
]
