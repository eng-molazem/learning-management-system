import { Languages } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function LanguageSwitcher() {
  const { lang, toggleLang } = useLanguage();
  return (
    <button
      onClick={toggleLang}
      className="btn-ghost !px-3 !py-2 text-sm"
      title={lang === "ar" ? "English" : "العربية"}
    >
      <Languages className="h-4 w-4" />
      {lang === "ar" ? "EN" : "AR"}
    </button>
  );
}
