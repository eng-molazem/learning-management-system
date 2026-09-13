import { LayoutDashboard, LogOut, Menu, ShieldCheck, ShoppingCart, User as UserIcon, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import Logo from "./ui/Logo";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors hover:text-white ${isActive ? "text-white" : "text-muted"}`;

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const links = [
    { to: "/courses", label: t("nav.courses") },
    { to: "/tracks", label: t("nav.tracks") },
    { to: "/books", label: t("nav.books") },
    { to: "/projects", label: t("nav.projects") },
    { to: "/community", label: t("nav.community") },
  ];

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/">
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          {user && (
            <Link to="/cart" className="btn-ghost relative !px-3 !py-2">
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-nebula-cyan px-1 text-[10px] font-bold text-black">
                  {count}
                </span>
              )}
            </Link>
          )}

          {user && <NotificationBell />}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-nebula-purple to-nebula-cyan text-sm font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="glass-strong absolute end-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl p-1.5">
                    <p className="truncate px-3 py-2 text-sm font-medium">{user.name}</p>
                    <Link
                      to={user.role === "admin" ? "/admin" : user.role === "instructor" ? "/instructor" : "/dashboard"}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {user.role === "admin" ? t("nav.adminPanel") : user.role === "instructor" ? t("nav.instructorPanel") : t("nav.dashboard")}
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                    >
                      <UserIcon className="h-4 w-4" />
                      {t("nav.profile")}
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {t("nav.adminPanel")}
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-red-300 hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("nav.logout")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-ghost">
                {t("nav.login")}
              </Link>
              <Link to="/signup" className="btn-primary !px-4 !py-2 text-sm">
                {t("nav.signup")}
              </Link>
            </div>
          )}

          <button className="btn-ghost !px-2 !py-2 lg:hidden" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={navLinkClass}
              >
                {l.label}
              </NavLink>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            {!user && (
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="btn-secondary flex-1" onClick={() => setMobileOpen(false)}>
                  {t("nav.login")}
                </Link>
                <Link to="/signup" className="btn-primary flex-1" onClick={() => setMobileOpen(false)}>
                  {t("nav.signup")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
