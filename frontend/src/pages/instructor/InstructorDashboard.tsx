import { useQuery } from "@tanstack/react-query";
import { BookOpen, ListChecks, Megaphone, Plus, Users2, Wallet } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { fetchCourses } from "../../services/courses";
import { announceCourse, fetchInstructorSummary } from "../../services/enrollments";

export default function InstructorDashboard() {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const { user } = useAuth();
  const [announcing, setAnnouncing] = useState<string | null>(null);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceMessage, setAnnounceMessage] = useState("");

  const canManage = user?.role === "admin" || user?.status === "active";

  const { data: summary } = useQuery({
    queryKey: ["instructor", "summary"],
    queryFn: fetchInstructorSummary,
    enabled: canManage,
  });
  const { data } = useQuery({
    queryKey: ["courses", "mine"],
    queryFn: () => fetchCourses({ mine: "true" }),
    enabled: canManage,
  });

  const sendAnnouncement = async (courseId: string) => {
    await announceCourse(courseId, announceTitle, announceMessage);
    setAnnouncing(null);
    setAnnounceTitle("");
    setAnnounceMessage("");
  };

  if (!canManage) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-nebula-violet" />
          <div>
            <p className="text-2xl font-bold">{summary?.total_courses ?? 0}</p>
            <p className="text-xs text-muted">{t("instructor.myCourses")}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3">
          <Users2 className="h-8 w-8 text-nebula-cyan" />
          <div>
            <p className="text-2xl font-bold">{summary?.total_students ?? 0}</p>
            <p className="text-xs text-muted">{t("instructor.totalStudents")}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3">
          <Wallet className="h-8 w-8 text-emerald-400" />
          <div>
            <p className="text-2xl font-bold">${summary?.total_revenue ?? 0}</p>
            <p className="text-xs text-muted">{t("instructor.totalRevenue")}</p>
          </div>
        </GlassCard>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("instructor.myCourses")}</h2>
        <Link to="/instructor/courses/new">
          <Button><Plus className="h-4 w-4" /> {t("instructor.createCourse")}</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {data?.results.map((course) => (
          <GlassCard key={course.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{localize(course.title_ar, course.title_en)}</p>
                <p className="text-xs text-muted">
                  {course.student_count} {t("common.students")} · {course.status}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/instructor/courses/${course.id}/curriculum`}>
                  <Button variant="secondary"><ListChecks className="h-4 w-4" /> {t("instructor.curriculumBuilder")}</Button>
                </Link>
                <Link to={`/instructor/courses/${course.id}/edit`}>
                  <Button variant="secondary">{t("common.edit")}</Button>
                </Link>
                <Button variant="ghost" onClick={() => setAnnouncing(announcing === course.id ? null : course.id)}>
                  <Megaphone className="h-4 w-4" /> {t("instructor.sendAnnouncement")}
                </Button>
              </div>
            </div>
            {announcing === course.id && (
              <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                <input
                  className="input-glass"
                  placeholder={t("community.postTitle") as string}
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                />
                <textarea
                  className="input-glass resize-none"
                  rows={2}
                  placeholder={t("community.postContent") as string}
                  value={announceMessage}
                  onChange={(e) => setAnnounceMessage(e.target.value)}
                />
                <Button onClick={() => sendAnnouncement(course.id)}>{t("instructor.sendAnnouncement")}</Button>
              </div>
            )}
          </GlassCard>
        ))}
        {data?.results.length === 0 && <p className="text-center text-muted">{t("common.noResults")}</p>}
      </div>
    </div>
  );
}
