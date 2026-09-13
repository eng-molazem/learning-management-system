from rest_framework import serializers


class EnrollSerializer(serializers.Serializer):
    course_id = serializers.CharField()
    payment_id = serializers.CharField(required=False, allow_null=True)


class CompleteLessonSerializer(serializers.Serializer):
    lesson_id = serializers.CharField()


class SubmitExamSerializer(serializers.Serializer):
    course_id = serializers.CharField()
    answers = serializers.ListField(child=serializers.IntegerField())


class AnnouncementSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    message = serializers.CharField()
