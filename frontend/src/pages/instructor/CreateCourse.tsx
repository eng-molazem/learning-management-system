import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiErrorMessage } from "../../services/api";
import { createCourse, fetchCategories, fetchCourse, fetchPaths, updateCourse } from "../../services/courses";

export default function CreateCourse() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const navigate = useNavigate();

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: paths = [] } = useQuery({ queryKey: ["paths"], queryFn: fetchPaths });
  const { data: existing } = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourse(id!),
    enabled: isEdit,
  });

  const [form, setForm] = useState({
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    category_id: "",
    path_id: "",
    is_free: true,
    price: 0,
    level: "beginner",
    language: "ar",
    status: "draft",
    has_exam: false,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        title_ar: existing.title_ar,
        title_en: existing.title_en,
        description_ar: existing.description_ar || "",
        description_en: existing.description_en || "",
        category_id: existing.category_id,
        path_id: existing.path_id || "",
        is_free: existing.is_free,
        price: existing.price,
        level: existing.level,
        language: existing.language,
        status: existing.status,
        has_exam: existing.has_exam,
      });
    }
  }, [existing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { ...form, path_id: form.path_id || null };
      if (isEdit) {
        await updateCourse(id!, payload as any);
        navigate(-1);
      } else {
        const course = await createCourse(payload as any);
        navigate(`../courses/${course.id}/curriculum`);
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">{isEdit ? t("common.edit") : t("instructor.createCourse")}</h1>
      <GlassCard>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              className="input-glass"
              placeholder="العنوان بالعربية"
              value={form.title_ar}
              onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
            />
            <input
              required
              className="input-glass"
              placeholder="Title (English)"
              value={form.title_en}
              onChange={(e) => setForm({ ...form, title_en: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <textarea
              className="input-glass resize-none"
              rows={3}
              placeholder="الوصف بالعربية"
              value={form.description_ar}
              onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
            />
            <textarea
              className="input-glass resize-none"
              rows={3}
              placeholder="Description (English)"
              value={form.description_en}
              onChange={(e) => setForm({ ...form, description_en: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <select
              required
              className="input-glass"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">{t("courses.category")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{localize(c.name_ar, c.name_en)}</option>
              ))}
            </select>
            <select className="input-glass" value={form.path_id} onChange={(e) => setForm({ ...form, path_id: e.target.value })}>
              <option value="">{t("nav.tracks")} ({t("common.all")})</option>
              {paths.map((p) => (
                <option key={p.id} value={p.id}>{localize(p.title_ar, p.title_en)}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <select className="input-glass" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option value="beginner">{t("common.beginner")}</option>
              <option value="intermediate">{t("common.intermediate")}</option>
              <option value="advanced">{t("common.advanced")}</option>
            </select>
            <select className="input-glass" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
            <select className="input-glass" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_free}
                onChange={(e) => setForm({ ...form, is_free: e.target.checked })}
              />
              {t("common.free")}
            </label>
            {!form.is_free && (
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-glass w-32"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.has_exam}
                onChange={(e) => setForm({ ...form, has_exam: e.target.checked })}
              />
              {t("courses.finalExam")}
            </label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" loading={saving}>{t("common.save")}</Button>
        </form>
      </GlassCard>
    </div>
  );
}
