import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import { useLanguage } from "../contexts/LanguageContext";

export default function Contact() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-bold">{t("nav.contact")}</h1>
      <p className="mb-8 text-muted">
        {lang === "ar" ? "يسعدنا تواصلك معنا، سنرد عليك في أقرب وقت ممكن." : "We'd love to hear from you, we'll respond as soon as possible."}
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-1">
          <GlassCard className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-nebula-cyan" />
            <span className="text-sm">support@horizon.academy</span>
          </GlassCard>
          <GlassCard className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-nebula-cyan" />
            <span className="text-sm">+966 500 000 000</span>
          </GlassCard>
          <GlassCard className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-nebula-cyan" />
            <span className="text-sm">{lang === "ar" ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}</span>
          </GlassCard>
        </div>
        <GlassCard className="md:col-span-2">
          {sent ? (
            <p className="py-10 text-center text-emerald-300">{t("common.success")}</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <input
                required
                placeholder={t("auth.name") as string}
                className="input-glass"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                required
                type="email"
                placeholder={t("auth.email") as string}
                className="input-glass"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <textarea
                required
                rows={5}
                placeholder={lang === "ar" ? "رسالتك" : "Your message"}
                className="input-glass resize-none"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <Button type="submit">
                <Send className="h-4 w-4" />
                {lang === "ar" ? "إرسال" : "Send"}
              </Button>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
