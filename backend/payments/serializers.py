from rest_framework import serializers

PAYABLE_TYPES = ("certificate", "course", "book", "project")


class CreateIntentSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=PAYABLE_TYPES)
    ref_id = serializers.CharField()
    coupon_code = serializers.CharField(required=False, allow_blank=True)


class ConfirmPaymentSerializer(serializers.Serializer):
    payment_id = serializers.CharField()


class PayoutMethodSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=100)
    holder_name = serializers.CharField(max_length=150)
    masked_number = serializers.CharField(max_length=50)
    bank_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    is_active = serializers.BooleanField(default=True)


CART_ITEM_TYPES = ("course", "book", "project")


class CartAddSerializer(serializers.Serializer):
    item_type = serializers.ChoiceField(choices=CART_ITEM_TYPES)
    item_id = serializers.CharField()


class CartCheckoutSerializer(serializers.Serializer):
    coupon_code = serializers.CharField(required=False, allow_blank=True)


class CouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=40)
    percent_off = serializers.IntegerField(required=False, min_value=1, max_value=100)
    amount_off = serializers.FloatField(required=False)
    applies_to = serializers.ChoiceField(choices=("all",) + PAYABLE_TYPES, default="all")
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    is_active = serializers.BooleanField(default=True)
