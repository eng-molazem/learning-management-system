import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import GlassCard from "../../components/ui/GlassCard";
import { useLanguage } from "../../contexts/LanguageContext";
import { fetchAllCertificatesAdmin } from "../../services/certificates";

export default function AdminCertificates() {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const { data: certs = [], isLoading } = useQuery({
    queryKey: ["admin", "certificates"],
    queryFn: fetchAllCertificatesAdmin,
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("admin.certificates")}</h1>
      {isLoading ? (
        <p className="text-center text-muted">{t("common.loading")}</p>
      ) : (
        <GlassCard className="!p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-xs text-muted">
              <tr>
                <th className="p-3 text-start">Student</th>
                <th className="p-3 text-start">Course</th>
                <th className="p-3 text-start">Code</th>
                <th className="p-3 text-start">Grade</th>
                <th className="p-3 text-start">Date</th>
              </tr>
            </thead>
            <tbody>
              {certs.map((c: any) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="p-3">{c.user?.name}</td>
                  <td className="p-3">{c.course && localize(c.course.title_ar, c.course.title_en)}</td>
                  <td className="p-3 font-mono text-xs">{c.certificate_code}</td>
                  <td className="p-3">{c.grade}</td>
                  <td className="p-3 text-muted">{new Date(c.issued_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}
