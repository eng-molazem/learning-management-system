import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { mediaUrl } from "../services/api";
import * as authApi from "../services/auth";

export default function Profile() {
  const { t } = useTranslation();
  const { lang, setLang } = useLanguage();
  const { user, updateUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    const updated = await authApi.updateProfile({ name, bio });
    updateUser(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const avatar = await authApi.uploadAvatar(file);
    updateUser({ avatar });
  };

  const statCards = [
    { label: t("profile.coursesEnrolled"), value: user.stats?.courses_enrolled ?? 0 },
    { label: t("profile.coursesCompleted"), value: user.stats?.courses_completed ?? 0 },
    { label: t("profile.certificatesEarned"), value: user.stats?.certificates_earned ?? 0 },
    { label: t("dashboard.xp"), value: user.xp },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">{t("profile.title")}</h1>

      <GlassCard strong className="mb-6 flex flex-col items-center gap-3">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-nebula-purple to-nebula-cyan text-3xl font-bold text-white">
            {user.avatar ? (
              <img src={mediaUrl(user.avatar)} className="h-full w-full object-cover" alt="" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -end-1 flex h-8 w-8 items-center justify-center rounded-full bg-nebula-violet text-white shadow-lg"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <p className="font-semibold">{user.name}</p>
        <p className="text-sm text-muted">{user.email}</p>
        <span className="badge">{t(`auth.role${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` as any, user.role)}</span>
      </GlassCard>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((s, i) => (
          <GlassCard key={i} className="text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="space-y-4">
        <h2 className="font-semibold">{t("profile.editProfile")}</h2>
        <input className="input-glass" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea
          className="input-glass resize-none"
          rows={3}
          placeholder={t("profile.bio") as string}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <div>
          <label className="mb-1 block text-sm text-muted">{t("profile.language")}</label>
          <select className="input-glass w-auto" value={lang} onChange={(e) => setLang(e.target.value as "ar" | "en")}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>
        <Button onClick={handleSave} loading={saving}>
          {saved ? t("common.success") : t("common.save")}
        </Button>
      </GlassCard>
    </div>
  );
}
