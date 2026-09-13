import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, ShieldCheck, ShoppingBag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import { useCart } from "../contexts/CartContext";
import { apiErrorMessage, mediaUrl } from "../services/api";
import * as paymentsApi from "../services/payments";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

function CartCheckoutModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [couponCode, setCouponCode] = useState("");
  const [intent, setIntent] = useState<Awaited<ReturnType<typeof paymentsApi.checkoutCart>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const config = await paymentsApi.fetchStripeConfig();
      const result = await paymentsApi.checkoutCart(couponCode || undefined);
      setIntent(result);
      if (!result.mock && config.publishable_key && !stripePromise) {
        stripePromise = loadStripe(config.publishable_key);
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const confirmMock = async () => {
    if (!intent) return;
    setLoading(true);
    try {
      await paymentsApi.confirmCart(intent.payment_ids);
      onDone();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <GlassCard strong className="w-full max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{t("cart.checkout")}</h3>
          <button onClick={onClose} className="btn-ghost !p-1.5"><X className="h-4 w-4" /></button>
        </div>
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        {!intent ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                className="input-glass"
                placeholder={t("cart.couponCode") as string}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
            </div>
            <Button className="w-full" loading={loading} onClick={startCheckout}>
              {t("cart.checkout")}
            </Button>
          </div>
        ) : intent.mock ? (
          <div className="space-y-4">
            <div className="glass rounded-xl p-3 text-sm text-amber-300">{t("payment.mockNotice")}</div>
            <div className="flex items-center justify-between text-lg font-bold">
              <span>{t("cart.total")}</span>
              <span>${intent.amount}</span>
            </div>
            <Button className="w-full" loading={loading} onClick={confirmMock}>
              <ShieldCheck className="h-4 w-4" /> {t("payment.confirmMockPayment")}
            </Button>
          </div>
        ) : stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret: intent.client_secret }}>
            <RealCartStripeForm intent={intent} onDone={onDone} />
          </Elements>
        ) : null}
      </GlassCard>
    </div>
  );
}

function RealCartStripeForm({ intent, onDone }: { intent: any; onDone: () => void }) {
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
    const { error: stripeError } = await stripe.confirmCardPayment(intent.client_secret, {
      payment_method: { card },
    });
    if (stripeError) {
      setError(stripeError.message || "");
      setLoading(false);
      return;
    }
    try {
      await paymentsApi.confirmCart(intent.payment_ids);
      onDone();
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
        <span>${intent.amount}</span>
      </div>
      <div className="input-glass !py-3">
        <CardElement options={{ style: { base: { color: "#f4f2ff", fontSize: "16px" } } }} />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" loading={loading} disabled={!stripe} className="w-full">
        <CreditCard className="h-4 w-4" /> {t("payment.payNow")}
      </Button>
    </form>
  );
}

export default function Cart() {
  const { t } = useTranslation();
  const { refreshCart } = useCart();
  const qc = useQueryClient();
  const [showCheckout, setShowCheckout] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["cart"], queryFn: paymentsApi.fetchCart });

  const handleRemove = async (itemId: string) => {
    await paymentsApi.removeFromCart(itemId);
    qc.invalidateQueries({ queryKey: ["cart"] });
    refreshCart();
  };

  const handleDone = () => {
    setShowCheckout(false);
    qc.invalidateQueries({ queryKey: ["cart"] });
    qc.invalidateQueries({ queryKey: ["courses"] });
    refreshCart();
  };

  if (isLoading) return <p className="text-center text-muted">{t("common.loading")}</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">{t("cart.title")}</h1>
      {!data || data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center text-muted">
          <ShoppingBag className="h-12 w-12" />
          <p>{t("cart.empty")}</p>
          <Link to="/courses"><Button>{t("nav.courses")}</Button></Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((item) => (
              <GlassCard key={item.id} className="flex items-center gap-4">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-nebula-purple/40 to-nebula-cyan/30">
                  {item.thumbnail && <img src={mediaUrl(item.thumbnail)} className="h-full w-full object-cover" alt="" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted">${item.price}</p>
                </div>
                <button onClick={() => handleRemove(item.item_id)} className="btn-ghost !p-2 text-red-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </GlassCard>
            ))}
          </div>
          <GlassCard strong className="mt-6 flex items-center justify-between">
            <span className="text-lg font-bold">{t("cart.total")}</span>
            <span className="text-lg font-bold">${data.total}</span>
          </GlassCard>
          <Button className="mt-4 w-full" onClick={() => setShowCheckout(true)}>
            {t("cart.checkout")}
          </Button>
        </>
      )}

      {showCheckout && <CartCheckoutModal onClose={() => setShowCheckout(false)} onDone={handleDone} />}
    </div>
  );
}
