from rest_framework import serializers


class PostSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    content = serializers.CharField()
    tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class CommentSerializer(serializers.Serializer):
    content = serializers.CharField()
