import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { t } = useTranslation();
  const textSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className="flex items-center gap-2 font-bold">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-nebula-purple via-nebula-violet to-nebula-cyan shadow-glow">
        <Sparkles className="h-5 w-5 text-white" />
      </span>
      <span className={`${textSize} bg-gradient-to-r from-nebula-violet to-nebula-cyan bg-clip-text text-transparent`}>
        {t("app.name")}
      </span>
    </div>
  );
}
