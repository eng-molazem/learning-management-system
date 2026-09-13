from rest_framework import serializers


class BookSerializer(serializers.Serializer):
    title_ar = serializers.CharField(max_length=200)
    title_en = serializers.CharField(max_length=200)
    author = serializers.CharField(max_length=150, allow_blank=True, required=False)
    description_ar = serializers.CharField(allow_blank=True, required=False)
    description_en = serializers.CharField(allow_blank=True, required=False)
    category_id = serializers.CharField(required=False, allow_null=True)
    is_free = serializers.BooleanField(default=True)
    price = serializers.FloatField(default=0)
