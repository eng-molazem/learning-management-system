import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import CourseCard from "../components/CourseCard";
import GlassCard from "../components/ui/GlassCard";
import { useLanguage } from "../contexts/LanguageContext";
import { fetchPath } from "../services/courses";

export default function TrackDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const { data: path, isLoading } = useQuery({
    queryKey: ["path", id],
    queryFn: () => fetchPath(id!),
    enabled: !!id,
  });

  if (isLoading || !path) return <p className="text-center text-muted">{t("common.loading")}</p>;

  return (
    <div>
      <GlassCard className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{localize(path.title_ar, path.title_en)}</h1>
        <p className="text-muted">{localize(path.description_ar, path.description_en)}</p>
      </GlassCard>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {path.courses?.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
    </div>
  );
}
