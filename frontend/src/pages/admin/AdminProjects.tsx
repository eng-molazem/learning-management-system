import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { createProject, deleteProject, fetchProjects, uploadProjectFiles } from "../../services/projects";

export default function AdminProjects() {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const qc = useQueryClient();
  const { data: projects = [] } = useQuery({ queryKey: ["projects", "admin"], queryFn: () => fetchProjects() });
  const [form, setForm] = useState({ title_ar: "", title_en: "", description_ar: "", description_en: "", price: 0, tech_stack: "", demo_url: "" });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["projects", "admin"] });

  const handleCreate = async () => {
    if (!form.title_ar || !form.title_en) return;
    await createProject({ ...form, tech_stack: form.tech_stack.split(",").map((s) => s.trim()).filter(Boolean) });
    setForm({ title_ar: "", title_en: "", description_ar: "", description_en: "", price: 0, tech_stack: "", demo_url: "" });
    invalidate();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("admin.projects")}</h1>
      <GlassCard className="mb-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input-glass" placeholder="Arabic title" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
          <input className="input-glass" placeholder="English title" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input type="number" className="input-glass" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <input className="input-glass" placeholder="Tech stack (comma separated)" value={form.tech_stack} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} />
          <input className="input-glass" placeholder="Demo URL" value={form.demo_url} onChange={(e) => setForm({ ...form, demo_url: e.target.value })} />
        </div>
        <Button onClick={handleCreate}><Plus className="h-4 w-4" /> {t("common.add")}</Button>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <GlassCard key={p.id}>
            <p className="mb-2 font-semibold">{localize(p.title_ar, p.title_en)}</p>
            <div className="mb-2 flex flex-wrap gap-2 text-xs">
              <label className="btn-ghost cursor-pointer !py-1.5">
                <Upload className="h-3.5 w-3.5" /> Thumbnail
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadProjectFiles(p.id, { thumbnail: e.target.files[0] }).then(invalidate)} />
              </label>
              <label className="btn-ghost cursor-pointer !py-1.5">
                <Upload className="h-3.5 w-3.5" /> ZIP
                <input type="file" accept=".zip" className="hidden" onChange={(e) => e.target.files?.[0] && uploadProjectFiles(p.id, { file: e.target.files[0] }).then(invalidate)} />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="badge">${p.price}</span>
              <button onClick={() => deleteProject(p.id).then(invalidate)} className="btn-ghost !p-2 text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
