import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import Logo from "../components/ui/Logo";
import { useAuth } from "../contexts/AuthContext";
import { apiErrorMessage } from "../services/api";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      const dest =
        (location.state?.from as any)?.pathname ||
        (user.role === "admin" ? "/admin" : user.role === "instructor" ? "/instructor" : "/dashboard");
      navigate(dest, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, t("auth.invalidCredentials") as string));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center">
      <div className="mb-6"><Logo /></div>
      <GlassCard strong className="w-full">
        <h1 className="mb-6 text-center text-2xl font-bold">{t("auth.loginTitle")}</h1>
        <form onSubmit={submit} className="space-y-4">
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
            type="password"
            placeholder={t("auth.password") as string}
            className="input-glass"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            {t("auth.loginButton")}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          {t("auth.noAccount")}{" "}
          <Link to="/signup" className="font-medium text-nebula-violet hover:underline">
            {t("nav.signup")}
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
