from django.urls import path

from . import views

urlpatterns = [
    path("me", views.MyCertificatesView.as_view()),
    path("verify/<str:code>", views.VerifyCertificateView.as_view()),
    path("admin/all", views.AdminCertificatesView.as_view()),
]
