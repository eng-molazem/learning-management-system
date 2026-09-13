import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import * as paymentsApi from "../../services/payments";

export default function AdminPayments() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: methods = [] } = useQuery({ queryKey: ["admin", "payout-methods"], queryFn: paymentsApi.fetchPayoutMethods });
  const { data: coupons = [] } = useQuery({ queryKey: ["admin", "coupons"], queryFn: paymentsApi.fetchCoupons });

  const [methodForm, setMethodForm] = useState({ label: "", holder_name: "", masked_number: "", bank_name: "" });
  const [couponForm, setCouponForm] = useState({ code: "", percent_off: 10 });

  const invalidateMethods = () => qc.invalidateQueries({ queryKey: ["admin", "payout-methods"] });
  const invalidateCoupons = () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] });

  const addMethod = async () => {
    if (!methodForm.label || !methodForm.holder_name || !methodForm.masked_number) return;
    await paymentsApi.createPayoutMethod(methodForm);
    setMethodForm({ label: "", holder_name: "", masked_number: "", bank_name: "" });
    invalidateMethods();
  };

  const addCoupon = async () => {
    if (!couponForm.code) return;
    await paymentsApi.createCoupon(couponForm);
    setCouponForm({ code: "", percent_off: 10 });
    invalidateCoupons();
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold">
          <CreditCard className="h-6 w-6" /> {t("admin.payoutMethods")}
        </h1>
        <GlassCard className="mb-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <input className="input-glass" placeholder="Label (e.g. Main Visa)" value={methodForm.label} onChange={(e) => setMethodForm({ ...methodForm, label: e.target.value })} />
            <input className="input-glass" placeholder="Holder name" value={methodForm.holder_name} onChange={(e) => setMethodForm({ ...methodForm, holder_name: e.target.value })} />
            <input className="input-glass" placeholder="**** **** **** 1234" value={methodForm.masked_number} onChange={(e) => setMethodForm({ ...methodForm, masked_number: e.target.value })} />
            <input className="input-glass" placeholder="Bank name" value={methodForm.bank_name} onChange={(e) => setMethodForm({ ...methodForm, bank_name: e.target.value })} />
          </div>
          <Button onClick={addMethod}><Plus className="h-4 w-4" /> {t("common.add")}</Button>
        </GlassCard>
        <div className="grid gap-3 sm:grid-cols-2">
          {methods.map((m) => (
            <GlassCard key={m.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{m.label}</p>
                <p className="text-sm text-muted">{m.holder_name} · {m.masked_number}</p>
                {m.bank_name && <p className="text-xs text-muted">{m.bank_name}</p>}
              </div>
              <button
                onClick={() => paymentsApi.deletePayoutMethod(m.id).then(invalidateMethods)}
                className="btn-ghost !p-2 text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </GlassCard>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <Tag className="h-5 w-5" /> {t("admin.coupons")}
        </h2>
        <GlassCard className="mb-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="input-glass" placeholder="CODE20" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} />
            <input type="number" className="input-glass" placeholder="% off" value={couponForm.percent_off} onChange={(e) => setCouponForm({ ...couponForm, percent_off: Number(e.target.value) })} />
          </div>
          <Button onClick={addCoupon}><Plus className="h-4 w-4" /> {t("common.add")}</Button>
        </GlassCard>
        <div className="grid gap-3 sm:grid-cols-3">
          {coupons.map((c) => (
            <GlassCard key={c.id} className="flex items-center justify-between">
              <div>
                <p className="font-mono font-semibold">{c.code}</p>
                <p className="text-xs text-muted">{c.percent_off ? `${c.percent_off}%` : `$${c.amount_off}`} off</p>
              </div>
              <button onClick={() => paymentsApi.deleteCoupon(c.id).then(invalidateCoupons)} className="btn-ghost !p-2 text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
