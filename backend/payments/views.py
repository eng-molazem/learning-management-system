from datetime import datetime, timezone

from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from certificates.issuing import issue_certificate
from core.mongo import Collections, col
from core.permissions import IsAdmin, IsAuthenticated
from core.utils import serialize_doc, serialize_many, to_object_id

from .serializers import (
    CartAddSerializer,
    CartCheckoutSerializer,
    ConfirmPaymentSerializer,
    CouponSerializer,
    CreateIntentSerializer,
    PayoutMethodSerializer,
)
from .stripe_utils import create_payment_intent, retrieve_status, stripe_configured


def now():
    return datetime.now(timezone.utc)


def _resolve_amount(payable_type: str, ref_oid, user) -> tuple[float, str, dict]:
    """Returns (amount, currency, extra_context)."""
    if payable_type == "certificate":
        enrollment = col(Collections.ENROLLMENTS).find_one(
            {"user_id": to_object_id(user.id), "course_id": ref_oid, "completed": True}
        )
        if not enrollment:
            raise PermissionDenied("Complete the course before requesting a certificate.")
        existing = col(Collections.CERTIFICATES).find_one(
            {"user_id": to_object_id(user.id), "course_id": ref_oid, "payment_status": "paid"}
        )
        if existing:
            raise ValidationError({"detail": "Certificate already issued for this course."})
        setting = col(Collections.SITE_SETTINGS).find_one({"key": "certificate_price"})
        price = float(setting["value"]) if setting else 9.99
        currency_setting = col(Collections.SITE_SETTINGS).find_one({"key": "currency"})
        currency = currency_setting["value"] if currency_setting else "usd"
        return price, currency, {}
    if payable_type == "course":
        course = col(Collections.COURSES).find_one({"_id": ref_oid})
        if not course:
            raise NotFound("Course not found.")
        if course.get("is_free"):
            raise ValidationError({"detail": "This course is free."})
        return float(course["price"]), course.get("currency", "usd"), {}
    if payable_type == "book":
        book = col(Collections.BOOKS).find_one({"_id": ref_oid})
        if not book:
            raise NotFound("Book not found.")
        if book.get("is_free"):
            raise ValidationError({"detail": "This book is free."})
        return float(book["price"]), "usd", {}
    if payable_type == "project":
        project = col(Collections.PROJECTS).find_one({"_id": ref_oid})
        if not project:
            raise NotFound("Project not found.")
        return float(project["price"]), "usd", {}
    raise ValidationError({"type": "Unsupported payable type."})


def _apply_coupon(amount: float, code: str, payable_type: str) -> float:
    coupon = col(Collections.COUPONS).find_one({"code": code, "is_active": True})
    if not coupon:
        raise ValidationError({"coupon_code": "Invalid or expired coupon."})
    if coupon.get("expires_at") and coupon["expires_at"] < now():
        raise ValidationError({"coupon_code": "This coupon has expired."})
    if coupon.get("applies_to") not in ("all", payable_type):
        raise ValidationError({"coupon_code": "This coupon does not apply to this purchase."})
    if coupon.get("percent_off"):
        amount = amount * (1 - coupon["percent_off"] / 100)
    elif coupon.get("amount_off"):
        amount = max(amount - float(coupon["amount_off"]), 0)
    return round(amount, 2)


class CreateIntentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateIntentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        ref_oid = to_object_id(data["ref_id"])

        amount, currency, _ = _resolve_amount(data["type"], ref_oid, request.user)
        if data.get("coupon_code"):
            amount = _apply_coupon(amount, data["coupon_code"], data["type"])

        intent_id, client_secret, mock = create_payment_intent(
            amount,
            currency,
            {"type": data["type"], "ref_id": str(ref_oid), "user_id": request.user.id},
        )

        result = col(Collections.PAYMENTS).insert_one(
            {
                "user_id": to_object_id(request.user.id),
                "type": data["type"],
                "ref_id": ref_oid,
                "amount": amount,
                "currency": currency,
                "stripe_payment_intent_id": intent_id,
                "status": "pending",
                "created_at": now(),
            }
        )

        return Response(
            {
                "payment_id": str(result.inserted_id),
                "client_secret": client_secret,
                "amount": amount,
                "currency": currency,
                "mock": mock,
                "publishable_key": None if mock else None,
            }
        )


class ConfirmPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ConfirmPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment_oid = to_object_id(serializer.validated_data["payment_id"])
        payment = col(Collections.PAYMENTS).find_one(
            {"_id": payment_oid, "user_id": to_object_id(request.user.id)}
        )
        if not payment:
            raise NotFound("Payment not found.")

        if payment["status"] != "succeeded":
            stripe_status = retrieve_status(payment["stripe_payment_intent_id"])
            if stripe_status == "succeeded":
                col(Collections.PAYMENTS).update_one(
                    {"_id": payment_oid}, {"$set": {"status": "succeeded"}}
                )
                payment["status"] = "succeeded"
                col(Collections.NOTIFICATIONS).insert_one(
                    {
                        "user_id": payment["user_id"],
                        "title": "تم الدفع بنجاح",
                        "message": "تمت عملية الدفع بنجاح.",
                        "type": "payment_success",
                        "course_id": None,
                        "is_read": False,
                        "created_at": now(),
                    }
                )

        extra = {}
        if payment["status"] == "succeeded" and payment["type"] == "certificate":
            cert = issue_certificate(payment["user_id"], payment["ref_id"], payment_oid)
            extra["certificate"] = serialize_doc(cert)

        out = serialize_doc(payment)
        out.update(extra)
        return Response(out)


class MyPaymentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        docs = list(
            col(Collections.PAYMENTS).find({"user_id": to_object_id(request.user.id)}).sort(
                "created_at", -1
            )
        )
        return Response(serialize_many(docs))


# ---- Admin: payout methods ----


class PayoutMethodsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        docs = list(col(Collections.PAYOUT_METHODS).find())
        return Response(serialize_many(docs))

    def post(self, request):
        serializer = PayoutMethodSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = col(Collections.PAYOUT_METHODS).insert_one(serializer.validated_data)
        doc = col(Collections.PAYOUT_METHODS).find_one({"_id": result.inserted_id})
        return Response(serialize_doc(doc), status=201)


class PayoutMethodDetailView(APIView):
    permission_classes = [IsAdmin]

    def put(self, request, method_id):
        serializer = PayoutMethodSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        oid = to_object_id(method_id)
        col(Collections.PAYOUT_METHODS).update_one({"_id": oid}, {"$set": serializer.validated_data})
        return Response(serialize_doc(col(Collections.PAYOUT_METHODS).find_one({"_id": oid})))

    def delete(self, request, method_id):
        col(Collections.PAYOUT_METHODS).delete_one({"_id": to_object_id(method_id)})
        return Response(status=204)


# ---- Admin: coupons ----


class CouponsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(serialize_many(list(col(Collections.COUPONS).find())))

    def post(self, request):
        serializer = CouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        data["code"] = data["code"].upper()
        result = col(Collections.COUPONS).insert_one(data)
        return Response(serialize_doc(col(Collections.COUPONS).find_one({"_id": result.inserted_id})), status=201)


class CouponDetailView(APIView):
    permission_classes = [IsAdmin]

    def put(self, request, coupon_id):
        serializer = CouponSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        if "code" in data:
            data["code"] = data["code"].upper()
        oid = to_object_id(coupon_id)
        col(Collections.COUPONS).update_one({"_id": oid}, {"$set": data})
        return Response(serialize_doc(col(Collections.COUPONS).find_one({"_id": oid})))

    def delete(self, request, coupon_id):
        col(Collections.COUPONS).delete_one({"_id": to_object_id(coupon_id)})
        return Response(status=204)


_ITEM_COLLECTION = {
    "course": Collections.COURSES,
    "book": Collections.BOOKS,
    "project": Collections.PROJECTS,
}


def _resolve_item(item_type, item_id):
    doc = col(_ITEM_COLLECTION[item_type]).find_one({"_id": item_id})
    if not doc:
        return None
    price = 0 if doc.get("is_free") else float(doc.get("price", 0))
    title = doc.get("title_en") or doc.get("title_ar")
    thumb = doc.get("thumbnail") or doc.get("cover")
    return {"title": title, "price": price, "thumbnail": thumb}


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_oid = to_object_id(request.user.id)
        items = list(col(Collections.CART_ITEMS).find({"user_id": user_oid}))
        out = []
        total = 0.0
        for i in items:
            info = _resolve_item(i["item_type"], i["item_id"])
            if not info:
                continue
            item = serialize_doc(i)
            item.update(info)
            total += info["price"]
            out.append(item)
        return Response({"items": out, "total": round(total, 2)})

    def post(self, request):
        serializer = CartAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        item_oid = to_object_id(data["item_id"])
        if not _resolve_item(data["item_type"], item_oid):
            raise NotFound("Item not found.")
        col(Collections.CART_ITEMS).update_one(
            {"user_id": to_object_id(request.user.id), "item_type": data["item_type"], "item_id": item_oid},
            {"$set": {"added_at": now()}},
            upsert=True,
        )
        return Response({"detail": "Added to cart."}, status=201)


class CartItemDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        col(Collections.CART_ITEMS).delete_one(
            {"user_id": to_object_id(request.user.id), "item_id": to_object_id(item_id)}
        )
        return Response(status=204)


class CartCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CartCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_oid = to_object_id(request.user.id)
        cart_items = list(col(Collections.CART_ITEMS).find({"user_id": user_oid}))
        if not cart_items:
            raise ValidationError({"detail": "Cart is empty."})

        payable = []
        total = 0.0
        for i in cart_items:
            info = _resolve_item(i["item_type"], i["item_id"])
            if not info or info["price"] <= 0:
                continue
            payable.append((i["item_type"], i["item_id"], info["price"]))
            total += info["price"]

        if not payable:
            raise ValidationError({"detail": "Cart has no payable items (all free)."})

        coupon_code = serializer.validated_data.get("coupon_code")
        if coupon_code:
            total = _apply_coupon(total, coupon_code, "all")

        intent_id, client_secret, mock = create_payment_intent(
            total, "usd", {"type": "cart", "user_id": request.user.id}
        )

        payment_ids = []
        for item_type, item_id, price in payable:
            result = col(Collections.PAYMENTS).insert_one(
                {
                    "user_id": user_oid,
                    "type": item_type,
                    "ref_id": item_id,
                    "amount": price,
                    "currency": "usd",
                    "stripe_payment_intent_id": intent_id,
                    "status": "pending",
                    "created_at": now(),
                }
            )
            payment_ids.append(str(result.inserted_id))

        return Response(
            {
                "payment_ids": payment_ids,
                "client_secret": client_secret,
                "amount": round(total, 2),
                "mock": mock,
            }
        )


class CartConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payment_ids = request.data.get("payment_ids", [])
        user_oid = to_object_id(request.user.id)
        results = []
        for pid in payment_ids:
            payment = col(Collections.PAYMENTS).find_one({"_id": to_object_id(pid), "user_id": user_oid})
            if not payment:
                continue
            if payment["status"] != "succeeded":
                if retrieve_status(payment["stripe_payment_intent_id"]) == "succeeded":
                    col(Collections.PAYMENTS).update_one(
                        {"_id": payment["_id"]}, {"$set": {"status": "succeeded"}}
                    )
                    payment["status"] = "succeeded"
            if payment["status"] == "succeeded":
                if payment["type"] == "course":
                    try:
                        col(Collections.ENROLLMENTS).insert_one(
                            {
                                "user_id": user_oid,
                                "course_id": payment["ref_id"],
                                "progress": 0,
                                "completed": False,
                                "enrolled_at": now(),
                                "completion_date": None,
                                "payment_id": payment["_id"],
                            }
                        )
                    except Exception:
                        pass
                col(Collections.CART_ITEMS).delete_one(
                    {"user_id": user_oid, "item_type": payment["type"], "item_id": payment["ref_id"]}
                )
            results.append(serialize_doc(payment))
        return Response({"payments": results})


class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = list(col(Collections.WISHLIST_ITEMS).find({"user_id": to_object_id(request.user.id)}))
        out = []
        for i in items:
            info = _resolve_item(i["item_type"], i["item_id"])
            if not info:
                continue
            item = serialize_doc(i)
            item.update(info)
            out.append(item)
        return Response(out)

    def post(self, request):
        serializer = CartAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        item_oid = to_object_id(data["item_id"])
        if not _resolve_item(data["item_type"], item_oid):
            raise NotFound("Item not found.")
        try:
            col(Collections.WISHLIST_ITEMS).insert_one(
                {
                    "user_id": to_object_id(request.user.id),
                    "item_type": data["item_type"],
                    "item_id": item_oid,
                    "added_at": now(),
                }
            )
        except Exception:
            pass
        return Response({"detail": "Added to wishlist."}, status=201)


class WishlistItemDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        col(Collections.WISHLIST_ITEMS).delete_one(
            {"user_id": to_object_id(request.user.id), "item_id": to_object_id(item_id)}
        )
        return Response(status=204)


class StripeConfigView(APIView):
    permission_classes = []

    def get(self, request):
        from django.conf import settings

        return Response(
            {
                "mock": not stripe_configured(),
                "publishable_key": settings.STRIPE_PUBLISHABLE_KEY if stripe_configured() else None,
            }
        )
