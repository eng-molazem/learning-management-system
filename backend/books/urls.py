from django.urls import path

from . import views

urlpatterns = [
    path("", views.BookListCreateView.as_view()),
    path("<str:book_id>", views.BookDetailView.as_view()),
    path("<str:book_id>/upload", views.BookFileUploadView.as_view()),
    path("<str:book_id>/download", views.BookDownloadView.as_view()),
]
