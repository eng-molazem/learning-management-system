from rest_framework import serializers

ROLE_CHOICES = ("student", "instructor")


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    role = serializers.ChoiceField(choices=ROLE_CHOICES, default="student")
    lang_pref = serializers.ChoiceField(choices=("ar", "en"), default="ar")


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class RefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class ProfileUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, required=False)
    bio = serializers.CharField(allow_blank=True, required=False)
    lang_pref = serializers.ChoiceField(choices=("ar", "en"), required=False)


class AdminUserUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, required=False)
    role = serializers.ChoiceField(choices=("student", "instructor", "admin"), required=False)
    status = serializers.ChoiceField(choices=("active", "pending", "rejected", "banned"), required=False)
