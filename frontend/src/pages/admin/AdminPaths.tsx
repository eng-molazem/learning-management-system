import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { createPath, deletePath, fetchCourses, fetchPaths, updatePath } from "../../services/courses";

export default function AdminPaths() {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const qc = useQueryClient();
  const { data: paths = [] } = useQuery({ queryKey: ["paths"], queryFn: fetchPaths });
  const { data: coursesData } = useQuery({ queryKey: ["courses", "all-for-paths"], queryFn: () => fetchCourses({ all: "true", page_size: 200 }) });
  const [form, setForm] = useState({ title_ar: "", title_en: "", description_ar: "", description_en: "" });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["paths"] });

  const handleCreate = async () => {
    if (!form.title_ar || !form.title_en) return;
    await createPath(form);
    setForm({ title_ar: "", title_en: "", description_ar: "", description_en: "" });
    invalidate();
  };

  const toggleCourse = async (pathId: string, currentIds: string[], courseId: string) => {
    const next = currentIds.includes(courseId) ? currentIds.filter((i) => i !== courseId) : [...currentIds, courseId];
    await updatePath(pathId, { course_ids: next });
    invalidate();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("admin.paths")}</h1>
      <GlassCard className="mb-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input-glass" placeholder="Arabic title" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
          <input className="input-glass" placeholder="English title" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
        </div>
        <Button onClick={handleCreate}><Plus className="h-4 w-4" /> {t("common.add")}</Button>
      </GlassCard>

      <div className="space-y-4">
        {paths.map((p) => {
          const courseIds = (p as any).course_ids || [];
          return (
            <GlassCard key={p.id}>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">{localize(p.title_ar, p.title_en)}</p>
                <button onClick={() => deletePath(p.id).then(invalidate)} className="btn-ghost !p-2 text-red-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {coursesData?.results.map((c) => (
                  <label
                    key={c.id}
                    className={`badge cursor-pointer !py-1.5 ${courseIds.includes(c.id) ? "!border-nebula-violet text-nebula-violet" : ""}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={courseIds.includes(c.id)}
                      onChange={() => toggleCourse(p.id, courseIds, c.id)}
                    />
                    {localize(c.title_ar, c.title_en)}
                  </label>
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
