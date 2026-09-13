"""Single shared PyMongo client for the whole project.

We deliberately avoid an ODM (Djongo/MongoEngine) — they fight Django's ORM
assumptions and tend to break across Django versions. Views talk to Mongo
collections directly through this module and validate input with plain DRF
Serializers.
"""
from django.conf import settings
from pymongo import MongoClient
from pymongo.database import Database

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGO_URI)
    return _client


def get_db() -> Database:
    return get_client()[settings.MONGO_DB_NAME]


class Collections:
    USERS = "users"
    CATEGORIES = "categories"
    PATHS = "paths"
    COURSES = "courses"
    MODULES = "modules"
    LESSONS = "lessons"
    ENROLLMENTS = "enrollments"
    LESSON_COMPLETIONS = "lesson_completions"
    CERTIFICATES = "certificates"
    PAYMENTS = "payments"
    PAYOUT_METHODS = "payout_methods"
    BOOKS = "books"
    PROJECTS = "projects"
    NOTIFICATIONS = "notifications"
    ANNOUNCEMENTS = "announcements"
    COMMUNITY_POSTS = "community_posts"
    COMMUNITY_COMMENTS = "community_comments"
    COMMUNITY_LIKES = "community_likes"
    REVIEWS = "reviews"
    COUPONS = "coupons"
    CART_ITEMS = "cart_items"
    WISHLIST_ITEMS = "wishlist_items"
    XP_HISTORY = "xp_history"
    SITE_SETTINGS = "site_settings"


def col(name: str):
    return get_db()[name]


def ensure_indexes():
    """Create the indexes we rely on for uniqueness/lookups. Safe to call repeatedly."""
    db = get_db()
    db[Collections.USERS].create_index("email", unique=True)
    db[Collections.CATEGORIES].create_index("slug", unique=True)
    db[Collections.CERTIFICATES].create_index("certificate_code", unique=True)
    db[Collections.COUPONS].create_index("code", unique=True)
    db[Collections.ENROLLMENTS].create_index([("user_id", 1), ("course_id", 1)], unique=True)
    db[Collections.LESSON_COMPLETIONS].create_index(
        [("user_id", 1), ("lesson_id", 1)], unique=True
    )
    db[Collections.COMMUNITY_LIKES].create_index(
        [("post_id", 1), ("user_id", 1)], unique=True
    )
    db[Collections.WISHLIST_ITEMS].create_index(
        [("user_id", 1), ("item_type", 1), ("item_id", 1)], unique=True
    )
