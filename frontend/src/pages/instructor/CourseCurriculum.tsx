import { useQuery } from "@tanstack/react-query";
import { GripVertical, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiErrorMessage } from "../../services/api";
import { fetchCurriculum, saveCurriculum, uploadLessonVideo } from "../../services/courses";
import type { ExamQuestion } from "../../types";

interface LocalLesson {
  key: string;
  id?: string;
  module_key: string;
  title_ar: string;
  title_en: string;
  content: string;
  video_type: "youtube" | "upload" | "none";
  video_url: string;
  video_file_path: string | null;
  order: number;
  duration: number;
  is_preview: boolean;
}

interface LocalModule {
  key: string;
  id?: string;
  title_ar: string;
  title_en: string;
  order: number;
}

let keyCounter = 0;
const newKey = () => `k${Date.now()}_${keyCounter++}`;

export default function CourseCurriculum() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const uploadRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["curriculum", id],
    queryFn: () => fetchCurriculum(id!),
    enabled: !!id,
  });

  const [modules, setModules] = useState<LocalModule[]>([]);
  const [lessons, setLessons] = useState<LocalLesson[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setModules(
      data.modules.map((m: any) => ({ key: m.id, id: m.id, title_ar: m.title_ar, title_en: m.title_en, order: m.order }))
    );
    setLessons(
      data.modules.flatMap((m: any) =>
        m.lessons.map((l: any) => ({
          key: l.id,
          id: l.id,
          module_key: m.id,
          title_ar: l.title_ar,
          title_en: l.title_en,
          content: l.content || "",
          video_type: l.video_type,
          video_url: l.video_url || "",
          video_file_path: l.video_file_path,
          order: l.order,
          duration: l.duration,
          is_preview: l.is_preview,
        }))
      )
    );
    setQuestions(data.course.exam?.questions ?? []);
  }, [data]);

  if (isLoading) return <p className="text-center text-muted">{t("common.loading")}</p>;

  const addModule = () => {
    setModules((prev) => [...prev, { key: newKey(), title_ar: "", title_en: "", order: prev.length + 1 }]);
  };
  const removeModule = (key: string) => {
    setModules((prev) => prev.filter((m) => m.key !== key));
    setLessons((prev) => prev.filter((l) => l.module_key !== key));
  };
  const addLesson = (moduleKey: string) => {
    setLessons((prev) => [
      ...prev,
      {
        key: newKey(),
        module_key: moduleKey,
        title_ar: "",
        title_en: "",
        content: "",
        video_type: "youtube",
        video_url: "",
        video_file_path: null,
        order: prev.filter((l) => l.module_key === moduleKey).length + 1,
        duration: 0,
        is_preview: false,
      },
    ]);
  };
  const removeLesson = (key: string) => setLessons((prev) => prev.filter((l) => l.key !== key));

  const updateLesson = (key: string, patch: Partial<LocalLesson>) => {
    setLessons((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };
  const updateModule = (key: string, patch: Partial<LocalModule>) => {
    setModules((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  };

  const handleUploadVideo = async (lesson: LocalLesson, file: File) => {
    if (!lesson.id) return;
    const path = await uploadLessonVideo(lesson.id, file);
    updateLesson(lesson.key, { video_type: "upload", video_file_path: path, video_url: "" });
  };

  const addQuestion = () => setQuestions((prev) => [...prev, { question: "", options: ["", "", "", ""], correct_index: 0 }]);
  const removeQuestion = (i: number) => setQuestions((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const result = await saveCurriculum(id!, {
        modules: modules.map((m) => ({ temp_id: m.key, title_ar: m.title_ar, title_en: m.title_en, order: m.order })),
        lessons: lessons.map((l) => ({
          module_temp_id: l.module_key,
          title_ar: l.title_ar,
          title_en: l.title_en,
          content: l.content,
          video_type: l.video_type,
          video_url: l.video_url,
          video_file_path: l.video_file_path,
          order: l.order,
          duration: l.duration,
          is_preview: l.is_preview,
        })),
        exam: { questions },
      });
      setModules(
        result.modules.map((m: any) => ({ key: m.id, id: m.id, title_ar: m.title_ar, title_en: m.title_en, order: m.order }))
      );
      setLessons(
        result.modules.flatMap((m: any) =>
          m.lessons.map((l: any) => ({
            key: l.id,
            id: l.id,
            module_key: m.id,
            title_ar: l.title_ar,
            title_en: l.title_en,
            content: l.content || "",
            video_type: l.video_type,
            video_url: l.video_url || "",
            video_file_path: l.video_file_path,
            order: l.order,
            duration: l.duration,
            is_preview: l.is_preview,
          }))
        )
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {t("instructor.curriculumBuilder")} — {data && localize(data.course.title_ar, data.course.title_en)}
        </h1>
        <Button onClick={handleSave} loading={saving}>{saved ? t("common.success") : t("common.save")}</Button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-5">
        {modules.map((m) => (
          <GlassCard key={m.key}>
            <div className="mb-4 flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted" />
              <input
                className="input-glass flex-1"
                placeholder="عنوان الوحدة (عربي)"
                value={m.title_ar}
                onChange={(e) => updateModule(m.key, { title_ar: e.target.value })}
              />
              <input
                className="input-glass flex-1"
                placeholder="Module title (English)"
                value={m.title_en}
                onChange={(e) => updateModule(m.key, { title_en: e.target.value })}
              />
              <button onClick={() => removeModule(m.key)} className="btn-ghost !p-2 text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 ps-4">
              {lessons
                .filter((l) => l.module_key === m.key)
                .map((l) => (
                  <div key={l.key} className="rounded-xl bg-white/5 p-3">
                    <div className="mb-2 grid gap-2 sm:grid-cols-2">
                      <input
                        className="input-glass"
                        placeholder="عنوان الدرس"
                        value={l.title_ar}
                        onChange={(e) => updateLesson(l.key, { title_ar: e.target.value })}
                      />
                      <input
                        className="input-glass"
                        placeholder="Lesson title"
                        value={l.title_en}
                        onChange={(e) => updateLesson(l.key, { title_en: e.target.value })}
                      />
                    </div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <select
                        className="input-glass w-auto"
                        value={l.video_type}
                        onChange={(e) => updateLesson(l.key, { video_type: e.target.value as any })}
                      >
                        <option value="youtube">{t("instructor.youtubeLink")}</option>
                        <option value="upload">{t("instructor.uploadVideo")}</option>
                        <option value="none">—</option>
                      </select>
                      {l.video_type === "youtube" && (
                        <input
                          className="input-glass flex-1 min-w-[200px]"
                          placeholder="https://youtube.com/watch?v=..."
                          value={l.video_url}
                          onChange={(e) => updateLesson(l.key, { video_url: e.target.value })}
                        />
                      )}
                      {l.video_type === "upload" && (
                        <>
                          <input
                            ref={(el) => { uploadRefs.current[l.key] = el; }}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadVideo(l, file);
                            }}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={!l.id}
                            onClick={() => uploadRefs.current[l.key]?.click()}
                          >
                            <Upload className="h-4 w-4" />
                            {l.video_file_path ? "✓" : t("instructor.uploadVideo")}
                          </Button>
                          {!l.id && <span className="text-xs text-muted">{t("common.save")} {t("common.next")}</span>}
                        </>
                      )}
                      <label className="flex items-center gap-1.5 text-xs text-muted">
                        <input
                          type="checkbox"
                          checked={l.is_preview}
                          onChange={(e) => updateLesson(l.key, { is_preview: e.target.checked })}
                        />
                        {t("courses.preview")}
                      </label>
                      <button onClick={() => removeLesson(l.key)} className="btn-ghost !p-1.5 text-red-300">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              <Button type="button" variant="ghost" onClick={() => addLesson(m.key)}>
                <Plus className="h-4 w-4" /> {t("instructor.addLesson")}
              </Button>
            </div>
          </GlassCard>
        ))}
        <Button type="button" variant="secondary" onClick={addModule}>
          <Plus className="h-4 w-4" /> {t("instructor.addModule")}
        </Button>
      </div>

      <GlassCard>
        <h2 className="mb-4 font-semibold">{t("courses.finalExam")}</h2>
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <div key={qi} className="rounded-xl bg-white/5 p-3">
              <div className="mb-2 flex items-center gap-2">
                <input
                  className="input-glass flex-1"
                  placeholder="السؤال"
                  value={q.question}
                  onChange={(e) => {
                    const next = [...questions];
                    next[qi] = { ...q, question: e.target.value };
                    setQuestions(next);
                  }}
                />
                <button onClick={() => removeQuestion(qi)} className="btn-ghost !p-1.5 text-red-300">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`correct_${qi}`}
                      checked={q.correct_index === oi}
                      onChange={() => {
                        const next = [...questions];
                        next[qi] = { ...q, correct_index: oi };
                        setQuestions(next);
                      }}
                    />
                    <input
                      className="input-glass"
                      placeholder={`Option ${oi + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...questions];
                        const options = [...next[qi].options];
                        options[oi] = e.target.value;
                        next[qi] = { ...q, options };
                        setQuestions(next);
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <Button type="button" variant="ghost" onClick={addQuestion}>
            <Plus className="h-4 w-4" /> Add question
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
