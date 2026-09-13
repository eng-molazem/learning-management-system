from django.urls import path

from . import views

urlpatterns = [
    path("stats", views.StatsView.as_view()),
    path("public-stats", views.PublicStatsView.as_view()),
    path("financials", views.FinancialsView.as_view()),
    path("settings", views.SettingsView.as_view()),
    path("public-settings", views.PublicSettingsView.as_view()),
]
