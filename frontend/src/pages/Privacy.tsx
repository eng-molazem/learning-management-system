import { useTranslation } from "react-i18next";
import GlassCard from "../components/ui/GlassCard";
import { useLanguage } from "../contexts/LanguageContext";

export default function Privacy() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">{t("footer.privacy")}</h1>
      <GlassCard className="prose prose-invert max-w-none space-y-4 text-sm leading-7 text-muted">
        {lang === "ar" ? (
          <>
            <p>نحن في أكاديمية هورايزن نلتزم بحماية خصوصية مستخدمينا. نجمع فقط البيانات الضرورية لتقديم خدماتنا التعليمية مثل الاسم والبريد الإلكتروني وبيانات التقدم الدراسي.</p>
            <p>لا تتم مشاركة بياناتك الشخصية مع أي طرف ثالث دون موافقتك، باستثناء ما يلزم لمعالجة المدفوعات عبر مزود دفع موثوق.</p>
            <p>بيانات الدفع (أرقام البطاقات) لا تمر عبر خوادمنا مطلقاً، ويتم التعامل معها بالكامل عبر بوابة الدفع الآمنة.</p>
            <p>يمكنك في أي وقت طلب حذف حسابك وبياناتك عبر التواصل مع فريق الدعم.</p>
          </>
        ) : (
          <>
            <p>At Horizon Academy we are committed to protecting our users' privacy. We only collect data necessary to provide our educational services, such as name, email, and learning progress.</p>
            <p>Your personal data is never shared with third parties without your consent, except as required to process payments through a trusted payment provider.</p>
            <p>Payment data (card numbers) never touches our servers — it is handled entirely by the secure payment gateway.</p>
            <p>You can request deletion of your account and data at any time by contacting our support team.</p>
          </>
        )}
      </GlassCard>
    </div>
  );
}
