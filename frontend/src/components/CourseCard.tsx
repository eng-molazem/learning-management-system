import { BookOpen, Star, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { mediaUrl } from "../services/api";
import type { Course } from "../types";
import GlassCard from "./ui/GlassCard";

export default function CourseCard({ course }: { course: Course }) {
  const { t } = useTranslation();
  const { localize } = useLanguage();

  return (
    <Link to={`/courses/${course.id}`}>
      <GlassCard className="group flex h-full flex-col overflow-hidden !p-0 transition-transform hover:-translate-y-1 hover:shadow-glow">
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-nebula-purple/40 to-nebula-cyan/30">
          {course.thumbnail ? (
            <img
              src={mediaUrl(course.thumbnail)}
              alt=""
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-10 w-10 text-white/40" />
            </div>
          )}
          <div className="absolute top-2 start-2">
            {course.is_free ? (
              <span className="badge bg-emerald-500/20 !border-emerald-400/30 text-emerald-300">
                {t("common.free")}
              </span>
            ) : (
              <span className="badge">
                {course.currency === "usd" ? "$" : course.currency}
                {course.price}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          {course.category && (
            <span className="text-xs text-muted">{localize(course.category.name_ar, course.category.name_en)}</span>
          )}
          <h3 className="line-clamp-2 font-semibold">{localize(course.title_ar, course.title_en)}</h3>
          {course.instructor && <p className="text-sm text-muted">{course.instructor.name}</p>}
          <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {course.rating_avg?.toFixed(1) ?? "0.0"} ({course.rating_count ?? 0})
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {course.student_count ?? 0}
            </span>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
