from django.urls import path

from . import views

urlpatterns = [
    path("posts", views.PostListCreateView.as_view()),
    path("posts/<str:post_id>", views.PostDetailView.as_view()),
    path("posts/<str:post_id>/comments", views.CommentCreateView.as_view()),
    path("posts/<str:post_id>/like", views.LikeToggleView.as_view()),
    path("comments/<str:comment_id>", views.CommentDeleteView.as_view()),
]
