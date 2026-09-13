import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Download } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import PaymentModal from "../components/PaymentModal";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import { useLanguage } from "../contexts/LanguageContext";
import { mediaUrl } from "../services/api";
import { fetchMyCertificates } from "../services/certificates";
import { fetchMyEnrollments } from "../services/enrollments";
import type { Course } from "../types";

export default function Certificates() {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const qc = useQueryClient();
  const [payingCourse, setPayingCourse] = useState<Course | null>(null);

  const { data: certificates = [] } = useQuery({ queryKey: ["certificates", "me"], queryFn: fetchMyCertificates });
  const { data: enrollments = [] } = useQuery({ queryKey: ["enrollments", "me"], queryFn: fetchMyEnrollments });

  const certifiedCourseIds = new Set(certificates.map((c) => c.course_id));
  const eligible = enrollments.filter((e) => e.completed && !certifiedCourseIds.has(e.course_id) && e.course);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{t("certificates.title")}</h1>

      {eligible.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-semibold">{t("certificates.requestFor")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eligible.map((e) => (
              <GlassCard key={e.id} className="flex flex-col gap-3">
                <p className="font-medium">{localize(e.course!.title_ar, e.course!.title_en)}</p>
                <Button onClick={() => setPayingCourse(e.course!)}>
                  <Award className="h-4 w-4" /> {t("certificates.pay")}
                </Button>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {certificates.map((c) => (
          <GlassCard key={c.id} className="flex flex-col gap-3">
            <div className="flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-nebula-purple/40 to-nebula-cyan/30">
              <Award className="h-10 w-10 text-white/70" />
            </div>
            <p className="font-semibold">{c.course && localize(c.course.title_ar, c.course.title_en)}</p>
            <p className="text-xs text-muted">
              {t("certificates.grade")}: {c.grade} · {t("certificates.issuedOn")}: {new Date(c.issued_at).toLocaleDateString()}
            </p>
            <a href={mediaUrl(c.pdf_path)} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="w-full">
                <Download className="h-4 w-4" /> {t("certificates.download")}
              </Button>
            </a>
          </GlassCard>
        ))}
      </div>

      {certificates.length === 0 && eligible.length === 0 && (
        <p className="text-center text-muted">{t("common.noResults")}</p>
      )}

      {payingCourse && (
        <PaymentModal
          type="certificate"
          refId={payingCourse.id}
          onClose={() => setPayingCourse(null)}
          onSuccess={() => {
            setPayingCourse(null);
            qc.invalidateQueries({ queryKey: ["certificates", "me"] });
          }}
        />
      )}
    </div>
  );
}
