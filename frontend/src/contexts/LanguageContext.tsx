import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getStoredLang, setLang as applyLang } from "../i18n";

type Lang = "ar" | "en";

interface LanguageContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  localize: (ar?: string | null, en?: string | null) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getStoredLang());

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (newLang: Lang) => {
    applyLang(newLang);
    setLangState(newLang);
  };

  const toggleLang = () => setLang(lang === "ar" ? "en" : "ar");

  const localize = (ar?: string | null, en?: string | null) => {
    if (lang === "ar") return ar || en || "";
    return en || ar || "";
  };

  return (
    <LanguageContext.Provider value={{ lang, dir: lang === "ar" ? "rtl" : "ltr", setLang, toggleLang, localize }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
