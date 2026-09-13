from django.urls import path

from . import views

urlpatterns = [
    path("categories", views.CategoryListCreateView.as_view()),
    path("categories/<str:category_id>", views.CategoryDetailView.as_view()),
    path("paths", views.PathListCreateView.as_view()),
    path("paths/<str:path_id>", views.PathDetailView.as_view()),
    path("courses", views.CourseListCreateView.as_view()),
    path("courses/<str:course_id>", views.CourseDetailView.as_view()),
    path("courses/<str:course_id>/curriculum", views.CourseCurriculumView.as_view()),
    path("courses/<str:course_id>/reviews", views.CourseReviewsView.as_view()),
    path("lessons/<str:lesson_id>/video", views.LessonVideoUploadView.as_view()),
]
