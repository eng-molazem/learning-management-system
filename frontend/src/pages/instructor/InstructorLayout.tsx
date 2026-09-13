import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router-dom";
import DashboardTopbar from "../../components/DashboardTopbar";
import NebulaBackground from "../../components/NebulaBackground";
import GlassCard from "../../components/ui/GlassCard";
import { useAuth } from "../../contexts/AuthContext";

export default function InstructorLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <NebulaBackground />
      <DashboardTopbar />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("instructor.dashboard")}</h1>
        <nav className="flex gap-2">
          <NavLink to="/instructor" end className={({ isActive }) => `btn-ghost text-sm ${isActive ? "bg-white/10" : ""}`}>
            {t("instructor.myCourses")}
          </NavLink>
        </nav>
      </div>

      {user?.role === "instructor" && user.status === "pending" && (
        <GlassCard className="mb-6 flex items-start gap-3 !bg-amber-500/10">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-medium text-amber-300">{t("instructor.pendingApproval")}</p>
            <p className="text-sm text-muted">{t("instructor.pendingApprovalDesc")}</p>
          </div>
        </GlassCard>
      )}

      <Outlet />
    </div>
  );
}
