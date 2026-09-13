import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { CreditCard, Loader2, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import * as paymentsApi from "../services/payments";
import type { PayableType } from "../services/payments";
import { apiErrorMessage } from "../services/api";
import Button from "./ui/Button";
import GlassCard from "./ui/GlassCard";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

interface Props {
  type: PayableType;
  refId: string;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

function MockPaymentBox({ amount, currency, paymentId, onSuccess }: any) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await paymentsApi.confirmPayment(paymentId);
      onSuccess(result);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-3 text-sm text-amber-300">{t("payment.mockNotice")}</div>
      <div className="flex items-center justify-between text-lg font-bold">
        <span>{t("cart.total")}</span>
        <span>
          {currency === "usd" ? "$" : currency}
          {amount}
        </span>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button onClick={confirm} loading={loading} className="w-full">
        <ShieldCheck className="h-4 w-4" />
        {t("payment.confirmMockPayment")}
      </Button>
    </div>
  );
}

function RealStripeForm({ clientSecret, paymentId, amount, currency, onSuccess }: any) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");
    const card = elements.getElement(CardElement);
    if (!card) return;
    const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });
    if (stripeError) {
      setError(stripeError.message || t("common.error"));
      setLoading(false);
      return;
    }
    try {
      const result = await paymentsApi.confirmPayment(paymentId);
      onSuccess(result);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center justify-between text-lg font-bold">
        <span>{t("cart.total")}</span>
        <span>
          {currency === "usd" ? "$" : currency}
          {amount}
        </span>
      </div>
      <div className="input-glass !py-3">
        <CardElement options={{ style: { base: { color: "#f4f2ff", fontSize: "16px" } } }} />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" loading={loading} disabled={!stripe} className="w-full">
        <CreditCard className="h-4 w-4" />
        {t("payment.payNow")}
      </Button>
    </form>
  );
}

export default function PaymentModal({ type, refId, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const [intent, setIntent] = useState<Awaited<ReturnType<typeof paymentsApi.createIntent>> | null>(null);
  const [mockMode, setMockMode] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const config = await paymentsApi.fetchStripeConfig();
        const result = await paymentsApi.createIntent(type, refId);
        setIntent(result);
        setMockMode(result.mock);
        if (!result.mock && config.publishable_key && !stripePromise) {
          stripePromise = loadStripe(config.publishable_key);
        }
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, refId]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <GlassCard strong className="w-full max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{t("payment.title")}</h3>
          <button onClick={onClose} className="btn-ghost !p-1.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        {!intent ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-nebula-violet" />
          </div>
        ) : mockMode ? (
          <MockPaymentBox
            amount={intent.amount}
            currency={intent.currency}
            paymentId={intent.payment_id}
            onSuccess={onSuccess}
          />
        ) : stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret: intent.client_secret }}>
            <RealStripeForm
              clientSecret={intent.client_secret}
              paymentId={intent.payment_id}
              amount={intent.amount}
              currency={intent.currency}
              onSuccess={onSuccess}
            />
          </Elements>
        ) : (
          <p className="text-sm text-red-400">{t("common.error")}</p>
        )}
      </GlassCard>
    </div>
  );
}
