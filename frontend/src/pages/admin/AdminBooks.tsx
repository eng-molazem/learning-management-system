import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { createBook, deleteBook, fetchBooks, uploadBookFiles } from "../../services/books";

export default function AdminBooks() {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const qc = useQueryClient();
  const { data: books = [] } = useQuery({ queryKey: ["books", "admin"], queryFn: () => fetchBooks() });
  const [form, setForm] = useState({ title_ar: "", title_en: "", author: "", is_free: true, price: 0 });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["books", "admin"] });

  const handleCreate = async () => {
    if (!form.title_ar || !form.title_en) return;
    await createBook(form);
    setForm({ title_ar: "", title_en: "", author: "", is_free: true, price: 0 });
    invalidate();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("admin.books")}</h1>
      <GlassCard className="mb-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input-glass" placeholder="Arabic title" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
          <input className="input-glass" placeholder="English title" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
        </div>
        <input className="input-glass" placeholder={t("books.author") as string} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} />
            {t("common.free")}
          </label>
          {!form.is_free && (
            <input type="number" className="input-glass w-32" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          )}
        </div>
        <Button onClick={handleCreate}><Plus className="h-4 w-4" /> {t("common.add")}</Button>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((b) => (
          <GlassCard key={b.id}>
            <p className="mb-2 font-semibold">{localize(b.title_ar, b.title_en)}</p>
            <div className="mb-2 flex flex-wrap gap-2 text-xs">
              <label className="btn-ghost cursor-pointer !py-1.5">
                <Upload className="h-3.5 w-3.5" /> Cover
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadBookFiles(b.id, { cover: e.target.files[0] }).then(invalidate)} />
              </label>
              <label className="btn-ghost cursor-pointer !py-1.5">
                <Upload className="h-3.5 w-3.5" /> PDF
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadBookFiles(b.id, { file: e.target.files[0] }).then(invalidate)} />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="badge">{b.is_free ? t("common.free") : `$${b.price}`}</span>
              <button onClick={() => deleteBook(b.id).then(invalidate)} className="btn-ghost !p-2 text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
