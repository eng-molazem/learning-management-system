from datetime import datetime, timezone

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand

from core.mongo import Collections, col, ensure_indexes


def now():
    return datetime.now(timezone.utc)


CATEGORIES = [
    {"slug": "programming", "name_ar": "البرمجة", "name_en": "Programming", "icon": "code"},
    {"slug": "design", "name_ar": "التصميم", "name_en": "Design", "icon": "palette"},
    {"slug": "data-science", "name_ar": "علم البيانات", "name_en": "Data Science", "icon": "bar-chart"},
    {"slug": "business", "name_ar": "إدارة الأعمال", "name_en": "Business", "icon": "briefcase"},
    {"slug": "languages", "name_ar": "اللغات", "name_en": "Languages", "icon": "languages"},
    {"slug": "marketing", "name_ar": "التسويق", "name_en": "Marketing", "icon": "megaphone"},
]


class Command(BaseCommand):
    help = "Seed the database with a default admin user, categories and demo content."

    def handle(self, *args, **options):
        ensure_indexes()

        users = col(Collections.USERS)
        admin_email = settings.DEFAULT_ADMIN_EMAIL
        if not users.find_one({"email": admin_email}):
            users.insert_one(
                {
                    "name": "Horizon Admin",
                    "email": admin_email,
                    "password_hash": make_password(settings.DEFAULT_ADMIN_PASSWORD),
                    "role": "admin",
                    "status": "active",
                    "avatar": None,
                    "bio": "",
                    "xp": 0,
                    "level": 1,
                    "streak": 0,
                    "last_active_date": None,
                    "lang_pref": "ar",
                    "created_at": now(),
                }
            )
            self.stdout.write(self.style.SUCCESS(f"Created admin user {admin_email}"))
        else:
            self.stdout.write("Admin user already exists")

        cats = col(Collections.CATEGORIES)
        cat_ids = {}
        for c in CATEGORIES:
            existing = cats.find_one({"slug": c["slug"]})
            if existing:
                cat_ids[c["slug"]] = existing["_id"]
                continue
            result = cats.insert_one({**c})
            cat_ids[c["slug"]] = result.inserted_id
        self.stdout.write(self.style.SUCCESS(f"Ensured {len(CATEGORIES)} categories"))

        demo_instructor_email = "instructor@horizon.academy"
        instructor = users.find_one({"email": demo_instructor_email})
        if not instructor:
            result = users.insert_one(
                {
                    "name": "سارة أحمد",
                    "email": demo_instructor_email,
                    "password_hash": make_password("Instructor123!"),
                    "role": "instructor",
                    "status": "active",
                    "avatar": None,
                    "bio": "مدربة برمجة وتطوير ويب",
                    "xp": 0,
                    "level": 1,
                    "streak": 0,
                    "last_active_date": None,
                    "lang_pref": "ar",
                    "created_at": now(),
                }
            )
            instructor_id = result.inserted_id
            self.stdout.write(self.style.SUCCESS(f"Created demo instructor {demo_instructor_email}"))
        else:
            instructor_id = instructor["_id"]

        courses = col(Collections.COURSES)
        if courses.count_documents({}) == 0:
            demo_courses = [
                {
                    "title_ar": "أساسيات تطوير الويب",
                    "title_en": "Web Development Fundamentals",
                    "description_ar": "تعلم HTML وCSS وJavaScript من الصفر حتى بناء مواقع تفاعلية.",
                    "description_en": "Learn HTML, CSS and JavaScript from zero to building interactive sites.",
                    "instructor_id": instructor_id,
                    "category_id": cat_ids["programming"],
                    "path_id": None,
                    "thumbnail": None,
                    "is_free": True,
                    "price": 0,
                    "currency": "usd",
                    "level": "beginner",
                    "language": "ar",
                    "status": "published",
                    "has_exam": True,
                    "exam": {"questions": []},
                    "rating_avg": 0,
                    "rating_count": 0,
                    "created_at": now(),
                },
                {
                    "title_ar": "React احترافي من الصفر للاحتراف",
                    "title_en": "Professional React from Zero to Hero",
                    "description_ar": "دورة متقدمة في React وTypeScript وإدارة الحالة وبناء تطبيقات حقيقية.",
                    "description_en": "An advanced course on React, TypeScript, state management and real apps.",
                    "instructor_id": instructor_id,
                    "category_id": cat_ids["programming"],
                    "path_id": None,
                    "thumbnail": None,
                    "is_free": False,
                    "price": 49.99,
                    "currency": "usd",
                    "level": "advanced",
                    "language": "ar",
                    "status": "published",
                    "has_exam": True,
                    "exam": {"questions": []},
                    "rating_avg": 0,
                    "rating_count": 0,
                    "created_at": now(),
                },
            ]
            result = courses.insert_many(demo_courses)
            course_ids = result.inserted_ids

            modules = col(Collections.MODULES)
            lessons = col(Collections.LESSONS)
            for idx, course_id in enumerate(course_ids):
                m = modules.insert_one(
                    {"course_id": course_id, "title_ar": "الوحدة الأولى", "title_en": "Module 1", "order": 1}
                )
                lessons.insert_many(
                    [
                        {
                            "module_id": m.inserted_id,
                            "course_id": course_id,
                            "title_ar": "مقدمة الدورة",
                            "title_en": "Course Introduction",
                            "content": "",
                            "video_type": "youtube",
                            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                            "video_file_path": None,
                            "order": 1,
                            "duration": 300,
                            "is_preview": True,
                        },
                        {
                            "module_id": m.inserted_id,
                            "course_id": course_id,
                            "title_ar": "الدرس الثاني",
                            "title_en": "Lesson Two",
                            "content": "",
                            "video_type": "youtube",
                            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                            "video_file_path": None,
                            "order": 2,
                            "duration": 420,
                            "is_preview": False,
                        },
                    ]
                )
            self.stdout.write(self.style.SUCCESS(f"Created {len(demo_courses)} demo courses with lessons"))
        else:
            self.stdout.write("Courses already seeded")

        settings_col = col(Collections.SITE_SETTINGS)
        defaults = {
            "site_name": "Horizon Academy",
            "default_language": "ar",
            "certificate_price": "9.99",
            "currency": "usd",
        }
        for key, value in defaults.items():
            settings_col.update_one({"key": key}, {"$setOnInsert": {"key": key, "value": value}}, upsert=True)

        self.stdout.write(self.style.SUCCESS("Seed complete."))
