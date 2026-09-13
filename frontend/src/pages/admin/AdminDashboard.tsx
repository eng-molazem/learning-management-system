import { useQuery } from "@tanstack/react-query";
import { Award, BookOpen, DollarSign, FileText, FolderGit2, GraduationCap, MessageSquare, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import GlassCard from "../../components/ui/GlassCard";
import { fetchStats } from "../../services/admin";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: stats } = useQuery({ queryKey: ["admin", "stats"], queryFn: fetchStats });

  const cards = [
    { icon: Users, label: t("admin.students"), value: stats?.total_students },
    { icon: GraduationCap, label: t("admin.instructors"), value: stats?.total_instructors },
    { icon: BookOpen, label: t("admin.courses"), value: stats?.total_courses },
    { icon: FileText, label: t("admin.books"), value: stats?.total_books },
    { icon: FolderGit2, label: t("admin.projects"), value: stats?.total_projects },
    { icon: Award, label: t("admin.certificates"), value: stats?.total_certificates },
    { icon: MessageSquare, label: "Community posts", value: stats?.community_posts },
    { icon: DollarSign, label: t("admin.totalRevenue"), value: `$${stats?.total_revenue ?? 0}` },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("admin.dashboard")}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c, i) => (
          <GlassCard key={i} className="flex flex-col items-center gap-2 text-center">
            <c.icon className="h-6 w-6 text-nebula-violet" />
            <span className="text-2xl font-bold">{c.value ?? "—"}</span>
            <span className="text-xs text-muted">{c.label}</span>
          </GlassCard>
        ))}
      </div>
      {stats?.pending_instructors > 0 && (
        <GlassCard className="mt-6 !bg-amber-500/10">
          <p className="text-amber-300">
            {stats.pending_instructors} {t("admin.pendingInstructors")}
          </p>
        </GlassCard>
      )}
    </div>
  );
}
