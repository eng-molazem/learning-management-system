from django.urls import path

from . import views

urlpatterns = [
    path("", views.EnrollView.as_view()),
    path("me", views.MyEnrollmentsView.as_view()),
    path("complete-lesson", views.CompleteLessonView.as_view()),
    path("submit-exam", views.SubmitExamView.as_view()),
    path("leaderboard", views.LeaderboardView.as_view()),
    path("courses/<str:course_id>/announce", views.AnnounceCourseView.as_view()),
    path("instructor/summary", views.InstructorSummaryView.as_view()),
]
