import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import { useLanguage } from "../contexts/LanguageContext";
import { fetchPaths } from "../services/courses";

export default function Tracks() {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const { data: paths = [], isLoading } = useQuery({ queryKey: ["paths"], queryFn: fetchPaths });

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{t("nav.tracks")}</h1>
      {isLoading ? (
        <p className="text-center text-muted">{t("common.loading")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((p) => (
            <Link key={p.id} to={`/tracks/${p.id}`}>
              <GlassCard className="h-full transition-transform hover:-translate-y-1">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-nebula-purple to-nebula-cyan">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{localize(p.title_ar, p.title_en)}</h3>
                <p className="line-clamp-2 text-sm text-muted">{localize(p.description_ar, p.description_en)}</p>
                <p className="mt-3 text-xs text-nebula-cyan">{p.course_count ?? 0} {t("nav.courses")}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
