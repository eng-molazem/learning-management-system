from django.urls import path

from . import views

urlpatterns = [
    path("config", views.StripeConfigView.as_view()),
    path("create-intent", views.CreateIntentView.as_view()),
    path("confirm", views.ConfirmPaymentView.as_view()),
    path("me", views.MyPaymentsView.as_view()),
    path("payout-methods", views.PayoutMethodsView.as_view()),
    path("payout-methods/<str:method_id>", views.PayoutMethodDetailView.as_view()),
    path("coupons", views.CouponsView.as_view()),
    path("coupons/<str:coupon_id>", views.CouponDetailView.as_view()),
    path("cart", views.CartView.as_view()),
    path("cart/<str:item_id>", views.CartItemDeleteView.as_view()),
    path("cart-checkout", views.CartCheckoutView.as_view()),
    path("cart-confirm", views.CartConfirmView.as_view()),
    path("wishlist", views.WishlistView.as_view()),
    path("wishlist/<str:item_id>", views.WishlistItemDeleteView.as_view()),
]
