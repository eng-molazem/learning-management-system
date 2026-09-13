import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import Logo from "./ui/Logo";

export default function DashboardTopbar() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="glass-strong sticky top-0 z-50 mb-6 flex items-center justify-between rounded-2xl px-4 py-3">
      <Link to="/"><Logo size="sm" /></Link>
      <div className="flex items-center gap-1.5">
        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationBell />
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="btn-ghost !px-3 !py-2"
        >
          <LogOut className="h-4 w-4" />
          {t("nav.logout")}
        </button>
      </div>
    </header>
  );
}
