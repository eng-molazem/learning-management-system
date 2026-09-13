from collections import defaultdict
from datetime import datetime, timedelta, timezone

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.mongo import Collections, col
from core.permissions import IsAdmin

PUBLIC_SETTINGS_KEYS = {"site_name", "default_language", "currency", "certificate_price"}


def now():
    return datetime.now(timezone.utc)


class StatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        users = col(Collections.USERS)
        payments = col(Collections.PAYMENTS)
        succeeded = list(payments.find({"status": "succeeded"}))
        total_revenue = sum(float(p.get("amount", 0)) for p in succeeded)
        return Response(
            {
                "total_students": users.count_documents({"role": "student"}),
                "total_instructors": users.count_documents({"role": "instructor", "status": "active"}),
                "pending_instructors": users.count_documents({"role": "instructor", "status": "pending"}),
                "total_courses": col(Collections.COURSES).count_documents({}),
                "total_books": col(Collections.BOOKS).count_documents({}),
                "total_projects": col(Collections.PROJECTS).count_documents({}),
                "total_certificates": col(Collections.CERTIFICATES).count_documents({}),
                "total_enrollments": col(Collections.ENROLLMENTS).count_documents({}),
                "total_revenue": round(total_revenue, 2),
                "community_posts": col(Collections.COMMUNITY_POSTS).count_documents({}),
            }
        )


class PublicStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        users = col(Collections.USERS)
        return Response(
            {
                "total_students": users.count_documents({"role": "student"}),
                "total_instructors": users.count_documents({"role": "instructor", "status": "active"}),
                "total_courses": col(Collections.COURSES).count_documents({"status": "published"}),
                "total_certificates": col(Collections.CERTIFICATES).count_documents({}),
            }
        )


class FinancialsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        payments = list(col(Collections.PAYMENTS).find({"status": "succeeded"}).sort("created_at", -1))

        revenue_by_type = defaultdict(float)
        by_day = defaultdict(float)
        for p in payments:
            revenue_by_type[p["type"]] += float(p.get("amount", 0))
            day = p["created_at"].strftime("%Y-%m-%d") if p.get("created_at") else "unknown"
            by_day[day] += float(p.get("amount", 0))

        recent = []
        for p in payments[:20]:
            user = col(Collections.USERS).find_one({"_id": p["user_id"]})
            recent.append(
                {
                    "id": str(p["_id"]),
                    "user": user["name"] if user else "—",
                    "type": p["type"],
                    "amount": p["amount"],
                    "currency": p.get("currency", "usd"),
                    "created_at": p["created_at"].isoformat() if p.get("created_at") else None,
                }
            )

        series = sorted(by_day.items())[-30:]

        return Response(
            {
                "total_revenue": round(sum(revenue_by_type.values()), 2),
                "revenue_by_type": {k: round(v, 2) for k, v in revenue_by_type.items()},
                "revenue_over_time": [{"date": d, "amount": round(a, 2)} for d, a in series],
                "recent_transactions": recent,
            }
        )


class PublicSettingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        docs = list(col(Collections.SITE_SETTINGS).find({"key": {"$in": list(PUBLIC_SETTINGS_KEYS)}}))
        return Response({d["key"]: d["value"] for d in docs})


class SettingsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        docs = list(col(Collections.SITE_SETTINGS).find())
        return Response({d["key"]: d["value"] for d in docs})

    def post(self, request):
        for key, value in request.data.items():
            col(Collections.SITE_SETTINGS).update_one(
                {"key": key}, {"$set": {"key": key, "value": value}}, upsert=True
            )
        docs = list(col(Collections.SITE_SETTINGS).find())
        return Response({d["key"]: d["value"] for d in docs})
