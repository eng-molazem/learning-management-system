from datetime import datetime, timezone

from core.mongo import Collections, col

LESSON_XP = 10
COURSE_COMPLETE_XP = 50


def now():
    return datetime.now(timezone.utc)


def level_for_xp(xp: int) -> int:
    return xp // 100 + 1


def award_xp(user_id, amount: int, source: str):
    users = col(Collections.USERS)
    user = users.find_one({"_id": user_id})
    if not user:
        return
    new_xp = user.get("xp", 0) + amount
    new_level = level_for_xp(new_xp)
    users.update_one({"_id": user_id}, {"$set": {"xp": new_xp, "level": new_level}})
    col(Collections.XP_HISTORY).insert_one(
        {"user_id": user_id, "amount": amount, "source": source, "created_at": now()}
    )
    if new_level > user.get("level", 1):
        col(Collections.NOTIFICATIONS).insert_one(
            {
                "user_id": user_id,
                "title": "لقد ارتقيت مستوى جديد!",
                "message": f"وصلت إلى المستوى {new_level}",
                "type": "level_up",
                "course_id": None,
                "is_read": False,
                "created_at": now(),
            }
        )
