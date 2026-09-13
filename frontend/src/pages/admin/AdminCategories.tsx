import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import { createCategory, deleteCategory, fetchCategories, updateCategory } from "../../services/courses";

export default function AdminCategories() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const [form, setForm] = useState({ name_ar: "", name_en: "", slug: "", icon: "" });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const handleCreate = async () => {
    if (!form.name_ar || !form.name_en || !form.slug) return;
    await createCategory(form);
    setForm({ name_ar: "", name_en: "", slug: "", icon: "" });
    invalidate();
  };
  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    invalidate();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("admin.categories")}</h1>
      <GlassCard className="mb-6">
        <div className="grid gap-3 sm:grid-cols-4">
          <input className="input-glass" placeholder="Arabic name" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
          <input className="input-glass" placeholder="English name" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          <input className="input-glass" placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <input className="input-glass" placeholder="icon (lucide name)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
        </div>
        <Button className="mt-3" onClick={handleCreate}><Plus className="h-4 w-4" /> {t("common.add")}</Button>
      </GlassCard>

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((c) => (
          <GlassCard key={c.id} className="flex items-center justify-between">
            <div className="grid flex-1 grid-cols-2 gap-2">
              <input
                className="input-glass !py-1.5"
                defaultValue={c.name_ar}
                onBlur={(e) => updateCategory(c.id, { name_ar: e.target.value }).then(invalidate)}
              />
              <input
                className="input-glass !py-1.5"
                defaultValue={c.name_en}
                onBlur={(e) => updateCategory(c.id, { name_en: e.target.value }).then(invalidate)}
              />
            </div>
            <button onClick={() => handleDelete(c.id)} className="btn-ghost !p-2 text-red-300 ms-2">
              <Trash2 className="h-4 w-4" />
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
