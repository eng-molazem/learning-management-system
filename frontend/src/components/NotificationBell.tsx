import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as notificationsApi from "../services/notifications";
import GlassCard from "./ui/GlassCard";

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function NotificationBell() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsApi.fetchUnreadCount,
    refetchInterval: 30000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: notificationsApi.fetchNotifications,
    enabled: open,
  });

  const handleMarkAll = async () => {
    await notificationsApi.markAllRead();
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost relative !px-3 !py-2"
        aria-label="notifications"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-nebula-pink px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <GlassCard
            strong
            className="absolute end-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto p-0"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-3">
              <span className="font-semibold">{t("dashboard.notifications")}</span>
              <button onClick={handleMarkAll} className="flex items-center gap-1 text-xs text-muted hover:text-white">
                <CheckCheck className="h-3.5 w-3.5" />
                {t("dashboard.markAllRead")}
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">{t("dashboard.noNotifications")}</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-white/5 p-3 text-sm ${!n.is_read ? "bg-white/5" : ""}`}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="text-muted text-xs mt-0.5">{n.message}</p>
                  <p className="text-muted text-[10px] mt-1">{timeAgo(n.created_at)}</p>
                </div>
              ))
            )}
          </GlassCard>
        </>
      )}
    </div>
  );
}
