import { GraduationCap, Presentation } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import Logo from "../components/ui/Logo";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { apiErrorMessage } from "../services/api";
import type { Role } from "../types";

export default function Signup() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register({ name, email, password, role, lang_pref: lang });
      if (role === "instructor") {
        navigate("/instructor", { replace: true });
      } else {
        navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center py-8">
      <div className="mb-6"><Logo /></div>
      <GlassCard strong className="w-full">
        <h1 className="mb-6 text-center text-2xl font-bold">{t("auth.signupTitle")}</h1>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`glass-card flex flex-col items-center gap-2 !p-4 transition-all ${
              role === "student" ? "ring-2 ring-nebula-violet" : "opacity-70"
            }`}
          >
            <GraduationCap className="h-6 w-6 text-nebula-violet" />
            <span className="text-sm font-medium">{t("auth.roleStudent")}</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("instructor")}
            className={`glass-card flex flex-col items-center gap-2 !p-4 transition-all ${
              role === "instructor" ? "ring-2 ring-nebula-cyan" : "opacity-70"
            }`}
          >
            <Presentation className="h-6 w-6 text-nebula-cyan" />
            <span className="text-sm font-medium">{t("auth.roleInstructor")}</span>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input
            required
            placeholder={t("auth.name") as string}
            className="input-glass"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            required
            type="email"
            placeholder={t("auth.email") as string}
            className="input-glass"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            minLength={6}
            type="password"
            placeholder={t("auth.password") as string}
            className="input-glass"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            {t("auth.signupButton")}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="font-medium text-nebula-violet hover:underline">
            {t("nav.login")}
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
