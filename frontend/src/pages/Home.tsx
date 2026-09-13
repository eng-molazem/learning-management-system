import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, BookOpen, Rocket, Sparkles, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import CourseCard from "../components/CourseCard";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import { useLanguage } from "../contexts/LanguageContext";
import { fetchCourses } from "../services/courses";
import { fetchPaths } from "../services/courses";
import { fetchPublicStats } from "../services/admin";

export default function Home() {
  const { t } = useTranslation();
  const { localize } = useLanguage();

  const { data: coursesData } = useQuery({
    queryKey: ["courses", "featured"],
    queryFn: () => fetchCourses({ sort: "rating", page_size: 6 }),
  });
  const { data: paths } = useQuery({ queryKey: ["paths", "home"], queryFn: fetchPaths });
  const { data: stats } = useQuery({ queryKey: ["public-stats"], queryFn: fetchPublicStats });

  const statCards = [
    { icon: Users, label: t("home.stats.students"), value: stats?.total_students ?? "—" },
    { icon: BookOpen, label: t("home.stats.courses"), value: stats?.total_courses ?? "—" },
    { icon: Sparkles, label: t("home.stats.instructors"), value: stats?.total_instructors ?? "—" },
    { icon: Award, label: t("home.stats.certificates"), value: stats?.total_certificates ?? "—" },
  ];

  return (
    <div className="space-y-24">
      <section className="flex flex-col items-center gap-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="badge"
        >
          <Rocket className="h-3.5 w-3.5 text-nebula-cyan" />
          Horizon Academy
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl bg-gradient-to-r from-white via-nebula-violet to-nebula-cyan bg-clip-text text-4xl font-extrabold leading-tight text-transparent sm:text-5xl"
        >
          {t("home.heroTitle")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-xl text-muted"
        >
          {t("home.heroSubtitle")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex gap-3"
        >
          <Link to="/courses"><Button>{t("home.exploreCourses")}</Button></Link>
          <Link to="/signup"><Button variant="secondary">{t("home.joinNow")}</Button></Link>
        </motion.div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((s, i) => (
          <GlassCard key={i} className="flex flex-col items-center gap-2 text-center">
            <s.icon className="h-6 w-6 text-nebula-violet" />
            <span className="text-2xl font-bold">{s.value}</span>
            <span className="text-xs text-muted">{s.label}</span>
          </GlassCard>
        ))}
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("home.featuredCourses")}</h2>
          <Link to="/courses" className="text-sm text-nebula-violet hover:underline">
            {t("common.seeAll")}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {coursesData?.results.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>

      {paths && paths.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t("home.learningPaths")}</h2>
            <Link to="/tracks" className="text-sm text-nebula-violet hover:underline">
              {t("common.seeAll")}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paths.slice(0, 3).map((p) => (
              <Link key={p.id} to={`/tracks/${p.id}`}>
                <GlassCard className="h-full transition-transform hover:-translate-y-1">
                  <h3 className="mb-2 text-lg font-semibold">{localize(p.title_ar, p.title_en)}</h3>
                  <p className="line-clamp-2 text-sm text-muted">{localize(p.description_ar, p.description_en)}</p>
                  <p className="mt-3 text-xs text-nebula-cyan">{p.course_count ?? 0} {t("nav.courses")}</p>
                </GlassCard>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
