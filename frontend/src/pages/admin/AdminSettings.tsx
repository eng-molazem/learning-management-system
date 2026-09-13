import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import { fetchSettings, updateSettings } from "../../services/admin";

export default function AdminSettings() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "settings"], queryFn: fetchSettings });
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleSave = async () => {
    await updateSettings(form);
    qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">{t("admin.settings")}</h1>
      <GlassCard className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-muted">{t("admin.siteName")}</label>
          <input
            className="input-glass"
            value={form.site_name || ""}
            onChange={(e) => setForm({ ...form, site_name: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">{t("admin.defaultLanguage")}</label>
          <select
            className="input-glass"
            value={form.default_language || "ar"}
            onChange={(e) => setForm({ ...form, default_language: e.target.value })}
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">{t("admin.certificatePrice")}</label>
          <input
            type="number"
            step="0.01"
            className="input-glass"
            value={form.certificate_price || ""}
            onChange={(e) => setForm({ ...form, certificate_price: e.target.value })}
          />
        </div>
        <Button onClick={handleSave}>{saved ? t("common.success") : t("common.save")}</Button>
      </GlassCard>
    </div>
  );
}
