import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, PartyPopper } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import { useLanguage } from "../contexts/LanguageContext";
import { fetchCourse } from "../services/courses";
import { completeLesson, submitExam } from "../services/enrollments";
import type { Lesson } from "../types";

export default function Learn() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const qc = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourse(id!),
    enabled: !!id,
  });

  const allLessons: Lesson[] = useMemo(
    () => course?.modules.flatMap((m) => m.lessons) ?? [],
    [course]
  );
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [needsExam, setNeedsExam] = useState(false);
  const [examAnswers, setExamAnswers] = useState<number[]>([]);
  const [examResult, setExamResult] = useState<{ score: number; passed: boolean } | null>(null);

  useEffect(() => {
    if (!activeLessonId && allLessons.length > 0) {
      const firstIncomplete = allLessons.find((l) => !completedIds.has(l.id));
      setActiveLessonId(firstIncomplete?.id ?? allLessons[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLessons]);

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  if (isLoading || !course) {
    return <p className="text-center text-muted">{t("common.loading")}</p>;
  }

  const activeLesson = allLessons.find((l) => l.id === activeLessonId) ?? allLessons[0];

  const handleComplete = async () => {
    if (!activeLesson) return;
    const result = await completeLesson(activeLesson.id);
    setCompletedIds((prev) => new Set(prev).add(activeLesson.id));
    qc.invalidateQueries({ queryKey: ["auth", "me"] });
    if (result.needs_exam) {
      setNeedsExam(true);
      setExamAnswers(new Array(course.exam?.questions.length ?? 0).fill(-1));
    } else {
      const idx = allLessons.findIndex((l) => l.id === activeLesson.id);
      if (idx >= 0 && idx < allLessons.length - 1) {
        setActiveLessonId(allLessons[idx + 1].id);
      }
    }
  };

  const handleSubmitExam = async () => {
    const result = await submitExam(course.id, examAnswers);
    setExamResult(result);
    if (result.passed) qc.invalidateQueries({ queryKey: ["auth", "me"] });
  };

  const progress = Math.round((completedIds.size / (allLessons.length || 1)) * 100);
  const courseFullyDone = completedIds.size === allLessons.length && (!course.has_exam || examResult?.passed);

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <GlassCard className="order-2 h-fit lg:order-1 lg:col-span-1">
        <h3 className="mb-1 font-semibold">{localize(course.title_ar, course.title_en)}</h3>
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>{t("learn.yourProgress")}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-gradient-to-r from-nebula-purple to-nebula-cyan" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pe-1">
          {course.modules.map((m) => (
            <div key={m.id}>
              <p className="mb-1.5 text-xs font-medium text-nebula-violet">{localize(m.title_ar, m.title_en)}</p>
              {m.lessons.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setActiveLessonId(l.id);
                    setNeedsExam(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-sm ${
                    l.id === activeLessonId ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  {completedIds.has(l.id) ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted" />
                  )}
                  <span className="truncate">{localize(l.title_ar, l.title_en)}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="order-1 space-y-4 lg:order-2 lg:col-span-3">
        {needsExam ? (
          <GlassCard>
            <h2 className="mb-4 text-xl font-bold">{t("courses.finalExam")}</h2>
            {examResult ? (
              <div className="py-8 text-center">
                {examResult.passed ? (
                  <>
                    <PartyPopper className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
                    <p className="mb-4 font-medium text-emerald-300">{t("learn.examPassed")}</p>
                    <Link to="/certificates"><Button>{t("learn.requestCertificate")}</Button></Link>
                  </>
                ) : (
                  <>
                    <p className="mb-4 text-red-400">{t("learn.examFailed")}</p>
                    <Button onClick={() => setExamResult(null)}>{t("common.confirm")}</Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {(course.exam?.questions ?? []).map((q, qi) => (
                  <div key={qi}>
                    <p className="mb-2 font-medium">{q.question}</p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <label
                          key={oi}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                            examAnswers[qi] === oi ? "bg-nebula-purple/30" : "bg-white/5"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q${qi}`}
                            checked={examAnswers[qi] === oi}
                            onChange={() => {
                              const next = [...examAnswers];
                              next[qi] = oi;
                              setExamAnswers(next);
                            }}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {(course.exam?.questions.length ?? 0) === 0 && (
                  <p className="text-muted">{t("common.confirm")}</p>
                )}
                <Button onClick={handleSubmitExam}>{t("learn.submitExam")}</Button>
              </div>
            )}
          </GlassCard>
        ) : activeLesson ? (
          <>
            <VideoPlayer
              videoType={activeLesson.video_type}
              videoUrl={activeLesson.video_url}
              videoFilePath={activeLesson.video_file_path}
            />
            <GlassCard>
              <h2 className="mb-2 text-xl font-bold">{localize(activeLesson.title_ar, activeLesson.title_en)}</h2>
              {activeLesson.content && <p className="text-sm text-muted">{activeLesson.content}</p>}
              <div className="mt-5 flex items-center justify-between">
                <button
                  className="btn-ghost"
                  onClick={() => {
                    const idx = allLessons.findIndex((l) => l.id === activeLesson.id);
                    if (idx > 0) setActiveLessonId(allLessons[idx - 1].id);
                  }}
                >
                  <ChevronRight className="h-4 w-4 rtl:hidden" />
                  <ChevronLeft className="hidden h-4 w-4 rtl:block" />
                  {t("common.previous")}
                </button>
                {completedIds.has(activeLesson.id) ? (
                  <span className="badge text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t("learn.completed")}
                  </span>
                ) : (
                  <Button onClick={handleComplete}>{t("learn.markComplete")}</Button>
                )}
                <button
                  className="btn-ghost"
                  onClick={() => {
                    const idx = allLessons.findIndex((l) => l.id === activeLesson.id);
                    if (idx < allLessons.length - 1) setActiveLessonId(allLessons[idx + 1].id);
                  }}
                >
                  {t("common.next")}
                  <ChevronLeft className="h-4 w-4 rtl:hidden" />
                  <ChevronRight className="hidden h-4 w-4 rtl:block" />
                </button>
              </div>
            </GlassCard>
          </>
        ) : null}

        {courseFullyDone && !needsExam && (
          <GlassCard className="flex items-center justify-between !bg-emerald-500/10">
            <span className="flex items-center gap-2 font-medium text-emerald-300">
              <PartyPopper className="h-5 w-5" /> {t("learn.courseComplete")}
            </span>
            <Link to="/certificates"><Button>{t("learn.requestCertificate")}</Button></Link>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
