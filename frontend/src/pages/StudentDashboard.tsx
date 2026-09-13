import { useQuery } from "@tanstack/react-query";
import { Flame, Star, Trophy, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { fetchLeaderboard, fetchMyEnrollments } from "../services/enrollments";

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const { user } = useAuth();

  const { data: enrollments = [] } = useQuery({ queryKey: ["enrollments", "me"], queryFn: fetchMyEnrollments });
  const { data: leaderboard = [] } = useQuery({ queryKey: ["leaderboard"], queryFn: fetchLeaderboard });

  if (!user) return null;

  const xpForNextLevel = user.level * 100;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t("dashboard.welcome")}, {user.name} 👋</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <GlassCard className="flex flex-col items-center gap-1 text-center">
          <Zap className="h-6 w-6 text-nebula-cyan" />
          <span className="text-2xl font-bold">{user.xp}</span>
          <span className="text-xs text-muted">{t("dashboard.xp")}</span>
        </GlassCard>
        <GlassCard className="flex flex-col items-center gap-1 text-center">
          <Star className="h-6 w-6 text-amber-400" />
          <span className="text-2xl font-bold">{user.level}</span>
          <span className="text-xs text-muted">{t("dashboard.level")}</span>
        </GlassCard>
        <GlassCard className="flex flex-col items-center gap-1 text-center">
          <Flame className="h-6 w-6 text-orange-400" />
          <span className="text-2xl font-bold">{user.streak}</span>
          <span className="text-xs text-muted">{t("dashboard.streak")}</span>
        </GlassCard>
        <GlassCard className="flex flex-col items-center gap-1 text-center">
          <Trophy className="h-6 w-6 text-nebula-violet" />
          <span className="text-2xl font-bold">{enrollments.filter((e) => e.completed).length}</span>
          <span className="text-xs text-muted">{t("profile.coursesCompleted")}</span>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>{t("dashboard.level")} {user.level}</span>
          <span>{user.xp} / {xpForNextLevel} XP</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-nebula-purple to-nebula-cyan"
            style={{ width: `${Math.min(100, (user.xp / xpForNextLevel) * 100)}%` }}
          />
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-xl font-bold">{t("dashboard.myCourses")}</h2>
          {enrollments.length === 0 ? (
            <GlassCard className="text-center text-muted">
              <p className="mb-3">{t("common.noResults")}</p>
              <Link to="/courses"><Button>{t("nav.courses")}</Button></Link>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {enrollments.map((e) => (
                <GlassCard key={e.id} className="flex items-center gap-4">
                  <div className="h-14 w-20 shrink-0 rounded-lg bg-gradient-to-br from-nebula-purple/40 to-nebula-cyan/30" />
                  <div className="flex-1">
                    <p className="font-medium">{e.course && localize(e.course.title_ar, e.course.title_en)}</p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-gradient-to-r from-nebula-purple to-nebula-cyan" style={{ width: `${e.progress}%` }} />
                    </div>
                  </div>
                  <Link to={`/course/${e.course_id}/learn`}>
                    <Button variant="secondary">{t("courses.continueLearning")}</Button>
                  </Link>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold">{t("dashboard.leaderboard")}</h2>
          <GlassCard className="space-y-2">
            {leaderboard.slice(0, 10).map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                <span className="w-5 text-center text-sm font-bold text-muted">{i + 1}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-nebula-purple to-nebula-cyan text-xs font-bold text-white">
                  {entry.name.charAt(0)}
                </span>
                <span className="flex-1 truncate text-sm">{entry.name}</span>
                <span className="text-xs text-nebula-cyan">{entry.xp} XP</span>
              </div>
            ))}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
