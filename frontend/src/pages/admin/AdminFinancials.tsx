import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import GlassCard from "../../components/ui/GlassCard";
import { fetchFinancials } from "../../services/admin";

export default function AdminFinancials() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "financials"], queryFn: fetchFinancials });

  if (isLoading || !data) return <p className="text-center text-muted">{t("common.loading")}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("admin.financials")}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="text-center">
          <p className="text-2xl font-bold">${data.total_revenue}</p>
          <p className="text-xs text-muted">{t("admin.totalRevenue")}</p>
        </GlassCard>
        {Object.entries(data.revenue_by_type).map(([type, amount]) => (
          <GlassCard key={type} className="text-center">
            <p className="text-2xl font-bold">${amount as number}</p>
            <p className="text-xs capitalize text-muted">{type}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <h2 className="mb-4 font-semibold">Revenue over time</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.revenue_over_time}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
              <Tooltip contentStyle={{ background: "#170f33", border: "1px solid rgba(255,255,255,0.1)" }} />
              <Area type="monotone" dataKey="amount" stroke="#a78bfa" fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="!p-0 overflow-x-auto">
        <h2 className="p-4 pb-0 font-semibold">Recent transactions</h2>
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-xs text-muted">
            <tr>
              <th className="p-3 text-start">User</th>
              <th className="p-3 text-start">Type</th>
              <th className="p-3 text-start">Amount</th>
              <th className="p-3 text-start">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.recent_transactions.map((tx: any) => (
              <tr key={tx.id} className="border-b border-white/5">
                <td className="p-3">{tx.user}</td>
                <td className="p-3 capitalize">{tx.type}</td>
                <td className="p-3">${tx.amount}</td>
                <td className="p-3 text-muted">{tx.created_at && new Date(tx.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
