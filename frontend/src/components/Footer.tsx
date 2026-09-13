import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Logo from "./ui/Logo";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-16 border-t border-white/10 glass">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
        <div>
          <Logo size="sm" />
          <p className="mt-3 text-sm text-muted">{t("home.heroSubtitle")}</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">{t("footer.links")}</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link to="/courses" className="hover:text-white">{t("nav.courses")}</Link></li>
            <li><Link to="/tracks" className="hover:text-white">{t("nav.tracks")}</Link></li>
            <li><Link to="/books" className="hover:text-white">{t("nav.books")}</Link></li>
            <li><Link to="/projects" className="hover:text-white">{t("nav.projects")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">{t("footer.legal")}</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link to="/privacy" className="hover:text-white">{t("footer.privacy")}</Link></li>
            <li><Link to="/terms" className="hover:text-white">{t("footer.terms")}</Link></li>
            <li><Link to="/verify" className="hover:text-white">{t("nav.verify")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">{t("footer.contact")}</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link to="/contact" className="hover:text-white">{t("nav.contact")}</Link></li>
            <li><Link to="/help" className="hover:text-white">{t("nav.help")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {t("app.name")} — {t("footer.rights")}
      </div>
    </footer>
  );
}
