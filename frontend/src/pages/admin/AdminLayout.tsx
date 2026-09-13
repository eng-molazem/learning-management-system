import {
  BarChart3,
  BookMarked,
  FolderGit2,
  Home,
  Layers,
  LayoutGrid,
  Settings,
  ShieldCheck,
  Tag,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router-dom";
import DashboardTopbar from "../../components/DashboardTopbar";
import NebulaBackground from "../../components/NebulaBackground";

const items = [
  { to: "/admin", end: true, icon: Home, label: "admin.dashboard" },
  { to: "/admin/users", icon: Users, label: "admin.users" },
  { to: "/admin/instructors", icon: UserCog, label: "admin.pendingInstructors" },
  { to: "/admin/courses", icon: LayoutGrid, label: "admin.courses" },
  { to: "/admin/categories", icon: Tag, label: "admin.categories" },
  { to: "/admin/paths", icon: Layers, label: "admin.paths" },
  { to: "/admin/books", icon: BookMarked, label: "admin.books" },
  { to: "/admin/projects", icon: FolderGit2, label: "admin.projects" },
  { to: "/admin/certificates", icon: ShieldCheck, label: "admin.certificates" },
  { to: "/admin/payments", icon: Wallet, label: "admin.payments" },
  { to: "/admin/financials", icon: BarChart3, label: "admin.financials" },
  { to: "/admin/settings", icon: Settings, label: "admin.settings" },
];

export default function AdminLayout() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <NebulaBackground />
      <DashboardTopbar />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="glass-card h-fit space-y-1 p-3 lg:sticky lg:top-24">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                isActive ? "bg-white/10 text-white" : "text-muted hover:bg-white/5"
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {t(item.label as any)}
          </NavLink>
        ))}
      </aside>
      <div>
        <Outlet />
      </div>
      </div>
    </div>
  );
}
