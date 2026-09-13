import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import * as adminApi from "../../services/admin";

export default function AdminInstructors() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: pending = [], isLoading } = useQuery({
    queryKey: ["admin", "instructors", "pending"],
    queryFn: adminApi.fetchPendingInstructors,
  });

  const decide = async (id: string, status: "active" | "rejected") => {
    await adminApi.updateAdminUser(id, { status });
    qc.invalidateQueries({ queryKey: ["admin", "instructors", "pending"] });
    qc.invalidateQueries({ queryKey: ["admin", "stats"] });
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("admin.pendingInstructors")}</h1>
      {isLoading ? (
        <p className="text-center text-muted">{t("common.loading")}</p>
      ) : pending.length === 0 ? (
        <p className="text-center text-muted">{t("common.noResults")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pending.map((u) => (
            <GlassCard key={u.id} className="flex flex-col gap-3">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-muted">{u.email}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => decide(u.id, "active")}>
                  <Check className="h-4 w-4" /> {t("admin.approve")}
                </Button>
                <Button variant="danger" onClick={() => decide(u.id, "rejected")}>
                  <X className="h-4 w-4" /> {t("admin.reject")}
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
