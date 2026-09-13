import { api } from "./api";
import type { Notification } from "../types";

export async function fetchNotifications() {
  const { data } = await api.get("/notifications/me");
  return data as Notification[];
}
export async function fetchUnreadCount() {
  const { data } = await api.get("/notifications/unread-count");
  return data.count as number;
}
export async function markRead(id: string) {
  await api.post(`/notifications/${id}/read`);
}
export async function markAllRead() {
  await api.post("/notifications/read-all");
}
