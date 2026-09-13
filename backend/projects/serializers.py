from rest_framework import serializers


class ProjectSerializer(serializers.Serializer):
    title_ar = serializers.CharField(max_length=200)
    title_en = serializers.CharField(max_length=200)
    description_ar = serializers.CharField(allow_blank=True, required=False)
    description_en = serializers.CharField(allow_blank=True, required=False)
    price = serializers.FloatField()
    tech_stack = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    demo_url = serializers.CharField(required=False, allow_blank=True)
