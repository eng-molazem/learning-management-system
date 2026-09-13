import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="bg-gradient-to-r from-nebula-violet to-nebula-cyan bg-clip-text text-6xl font-bold text-transparent">
        404
      </h1>
      <p className="text-muted">{t("common.noResults")}</p>
      <Link to="/">
        <Button>{t("nav.home")}</Button>
      </Link>
    </div>
  );
}
