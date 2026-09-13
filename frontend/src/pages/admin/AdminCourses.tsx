import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { deleteCourse, fetchCourses } from "../../services/courses";

export default function AdminCourses() {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["courses", "admin-all"],
    queryFn: () => fetchCourses({ all: "true", page_size: 100 }),
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    await deleteCourse(id);
    qc.invalidateQueries({ queryKey: ["courses", "admin-all"] });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("admin.courses")}</h1>
        <Link to="/admin/courses/new">
          <Button><Plus className="h-4 w-4" /> {t("instructor.createCourse")}</Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-center text-muted">{t("common.loading")}</p>
      ) : (
        <div className="space-y-3">
          {data?.results.map((course) => (
            <GlassCard key={course.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{localize(course.title_ar, course.title_en)}</p>
                <p className="text-xs text-muted">
                  {course.instructor?.name} · {course.status} · {course.is_free ? t("common.free") : `$${course.price}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Link to={`/admin/courses/${course.id}/curriculum`}>
                  <Button variant="secondary"><ListChecks className="h-4 w-4" /></Button>
                </Link>
                <Link to={`/admin/courses/${course.id}/edit`}>
                  <Button variant="secondary">{t("common.edit")}</Button>
                </Link>
                <button onClick={() => handleDelete(course.id)} className="btn-ghost !p-2 text-red-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
