import { ShieldCheck, ShieldX } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import { useLanguage } from "../contexts/LanguageContext";
import { apiErrorMessage } from "../services/api";
import { verifyCertificate } from "../services/certificates";
import type { Certificate } from "../types";

export default function VerifyCertificate() {
  const { code: codeParam } = useParams<{ code: string }>();
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const [code, setCode] = useState(codeParam || "");
  const [cert, setCert] = useState<Certificate | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const check = async (c: string) => {
    if (!c.trim()) return;
    setLoading(true);
    setError("");
    setCert(null);
    try {
      const result = await verifyCertificate(c.trim());
      setCert(result);
    } catch (err) {
      setError(apiErrorMessage(err, t("certificates.notFound") as string));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codeParam) check(codeParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam]);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-center text-3xl font-bold">{t("certificates.verifyTitle")}</h1>
      <GlassCard strong>
        <div className="flex gap-2">
          <input
            className="input-glass"
            placeholder={t("certificates.verifyPlaceholder") as string}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check(code)}
          />
          <Button onClick={() => check(code)} loading={loading}>
            {t("common.confirm")}
          </Button>
        </div>

        {error && (
          <div className="mt-6 flex flex-col items-center gap-2 text-center text-red-400">
            <ShieldX className="h-10 w-10" />
            <p>{error}</p>
          </div>
        )}

        {cert && (
          <div className="mt-6 space-y-3 rounded-xl bg-emerald-500/10 p-4 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-emerald-400" />
            <p className="font-medium text-emerald-300">{t("certificates.verified")}</p>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted">{t("certificates.studentName")}:</span> {cert.student_name}</p>
              <p><span className="text-muted">{t("certificates.courseName")}:</span> {cert.course && localize(cert.course.title_ar, cert.course.title_en)}</p>
              <p><span className="text-muted">{t("certificates.grade")}:</span> {cert.grade}</p>
              <p><span className="text-muted">{t("certificates.issuedOn")}:</span> {new Date(cert.issued_at).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
