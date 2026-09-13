from rest_framework import serializers


class CategorySerializer(serializers.Serializer):
    name_ar = serializers.CharField(max_length=100)
    name_en = serializers.CharField(max_length=100)
    slug = serializers.SlugField()
    icon = serializers.CharField(max_length=50, required=False, allow_blank=True)


class PathSerializer(serializers.Serializer):
    title_ar = serializers.CharField(max_length=150)
    title_en = serializers.CharField(max_length=150)
    description_ar = serializers.CharField(allow_blank=True, required=False)
    description_en = serializers.CharField(allow_blank=True, required=False)
    icon = serializers.CharField(max_length=50, required=False, allow_blank=True)
    color = serializers.CharField(max_length=30, required=False, allow_blank=True)
    level = serializers.ChoiceField(choices=("beginner", "intermediate", "advanced"), default="beginner")
    course_ids = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class CourseSerializer(serializers.Serializer):
    title_ar = serializers.CharField(max_length=200)
    title_en = serializers.CharField(max_length=200)
    description_ar = serializers.CharField(allow_blank=True, required=False)
    description_en = serializers.CharField(allow_blank=True, required=False)
    category_id = serializers.CharField()
    path_id = serializers.CharField(required=False, allow_null=True)
    is_free = serializers.BooleanField(default=True)
    price = serializers.FloatField(default=0)
    currency = serializers.CharField(max_length=10, default="usd")
    level = serializers.ChoiceField(choices=("beginner", "intermediate", "advanced"), default="beginner")
    language = serializers.ChoiceField(choices=("ar", "en"), default="ar")
    status = serializers.ChoiceField(choices=("draft", "published"), default="draft")
    has_exam = serializers.BooleanField(default=False)


class ModuleSerializer(serializers.Serializer):
    title_ar = serializers.CharField(max_length=200)
    title_en = serializers.CharField(max_length=200)
    order = serializers.IntegerField(default=1)


class LessonSerializer(serializers.Serializer):
    module_id = serializers.CharField(required=False, allow_null=True)
    module_temp_id = serializers.CharField(required=False, allow_null=True)
    title_ar = serializers.CharField(max_length=200)
    title_en = serializers.CharField(max_length=200)
    content = serializers.CharField(allow_blank=True, required=False)
    video_type = serializers.ChoiceField(choices=("youtube", "upload", "none"), default="youtube")
    video_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    video_file_path = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    order = serializers.IntegerField(default=1)
    duration = serializers.IntegerField(default=0)
    is_preview = serializers.BooleanField(default=False)


class CurriculumSerializer(serializers.Serializer):
    modules = ModuleSerializer(many=True)
    lessons = LessonSerializer(many=True, required=False)
    exam = serializers.DictField(required=False)


class ReviewSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(allow_blank=True, required=False)
