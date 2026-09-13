import uuid

import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


def stripe_configured() -> bool:
    key = settings.STRIPE_SECRET_KEY or ""
    return key.startswith("sk_") and key not in ("sk_test_xxx",)


def create_payment_intent(amount: float, currency: str, metadata: dict):
    """Returns (intent_id, client_secret, mock). Falls back to a local mock
    flow when no real Stripe test key is configured, so the whole purchase
    flow is exercisable without a Stripe account. Swap in real keys in .env
    to switch to real Stripe test-mode Elements/Checkout automatically."""
    cents = max(int(round(amount * 100)), 0)
    if not stripe_configured():
        intent_id = f"mock_pi_{uuid.uuid4().hex}"
        return intent_id, f"{intent_id}_secret_mock", True

    intent = stripe.PaymentIntent.create(
        amount=cents,
        currency=currency,
        metadata=metadata,
        automatic_payment_methods={"enabled": True},
    )
    return intent.id, intent.client_secret, False


def retrieve_status(intent_id: str) -> str:
    if intent_id.startswith("mock_pi_"):
        return "succeeded"
    intent = stripe.PaymentIntent.retrieve(intent_id)
    return intent.status
