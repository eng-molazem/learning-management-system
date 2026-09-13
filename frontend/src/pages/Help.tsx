import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import GlassCard from "../components/ui/GlassCard";
import { useLanguage } from "../contexts/LanguageContext";

const FAQ_AR = [
  { q: "كيف أسجل في كورس؟", a: "توجه لصفحة الكورسات، اختر الكورس المناسب، ثم اضغط على زر التسجيل. إذا كان الكورس مدفوعاً ستحتاج لإتمام الدفع أولاً." },
  { q: "كيف أحصل على شهادة؟", a: "بعد إكمال جميع دروس الكورس واجتياز الاختبار النهائي (إن وجد)، يمكنك طلب شهادتك من صفحة الشهادات مقابل رسوم رمزية." },
  { q: "كيف أصبح مدرباً؟", a: "عند إنشاء حسابك اختر نوع الحساب 'معلّم'. سيقوم فريق الإدارة بمراجعة طلبك والموافقة عليه خلال وقت قصير." },
  { q: "هل يمكنني تحميل الفيديوهات؟", a: "الفيديوهات تُعرض داخل المنصة فقط عبر يوتيوب أو الفيديو المرفوع، ولا يمكن تحميلها مباشرة." },
];
const FAQ_EN = [
  { q: "How do I enroll in a course?", a: "Go to the Courses page, pick a course, and click Enroll. Paid courses require completing checkout first." },
  { q: "How do I get a certificate?", a: "After finishing all lessons and passing the final exam (if any), request your certificate from the Certificates page for a small fee." },
  { q: "How do I become an instructor?", a: "Choose 'Instructor' as your account type when signing up. Our admin team will review and approve your request shortly." },
  { q: "Can I download videos?", a: "Videos are streamed in-platform only (YouTube or uploaded), they cannot be downloaded directly." },
];

export default function Help() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const faq = lang === "ar" ? FAQ_AR : FAQ_EN;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-3xl font-bold">{t("nav.help")}</h1>
      <div className="space-y-3">
        {faq.map((item, i) => (
          <GlassCard key={i} className="!p-0 overflow-hidden">
            <button
              className="flex w-full items-center justify-between p-4 text-start font-medium"
              onClick={() => setOpen(open === i ? null : i)}
            >
              {item.q}
              <ChevronDown className={`h-4 w-4 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <p className="border-t border-white/10 p-4 text-sm text-muted">{item.a}</p>}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
