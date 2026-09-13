import { useTranslation } from "react-i18next";
import GlassCard from "../components/ui/GlassCard";
import { useLanguage } from "../contexts/LanguageContext";

export default function Terms() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">{t("footer.terms")}</h1>
      <GlassCard className="prose prose-invert max-w-none space-y-4 text-sm leading-7 text-muted">
        {lang === "ar" ? (
          <>
            <p>باستخدامك لمنصة أكاديمية هورايزن فإنك توافق على الشروط والأحكام التالية.</p>
            <p>يمنع مشاركة حسابك مع أطراف أخرى، أو إعادة توزيع محتوى الكورسات دون إذن كتابي من المنصة.</p>
            <p>الشهادات الصادرة عن المنصة تعكس إتمام المحتوى التعليمي داخل هورايزن فقط ولا تعادل شهادات أكاديمية رسمية.</p>
            <p>تحتفظ الإدارة بحق تعديل الأسعار والمحتوى في أي وقت مع إشعار المستخدمين بذلك.</p>
          </>
        ) : (
          <>
            <p>By using the Horizon Academy platform, you agree to the following terms and conditions.</p>
            <p>Sharing your account with others, or redistributing course content without written permission, is prohibited.</p>
            <p>Certificates issued by the platform reflect completion of Horizon content only and are not equivalent to formal academic degrees.</p>
            <p>The administration reserves the right to modify pricing and content at any time, with notice to users.</p>
          </>
        )}
      </GlassCard>
    </div>
  );
}
