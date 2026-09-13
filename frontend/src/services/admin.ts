import { api } from "./api";
import type { User } from "../types";

export async function fetchAdminUsers(params: { role?: string; status?: string; search?: string } = {}) {
  const { data } = await api.get("/auth/admin/users", { params });
  return data as User[];
}
export async function fetchPendingInstructors() {
  const { data } = await api.get("/auth/admin/instructors/pending");
  return data as User[];
}
export async function updateAdminUser(id: string, payload: Partial<User>) {
  const { data } = await api.put(`/auth/admin/users/${id}`, payload);
  return data as User;
}
export async function deleteAdminUser(id: string) {
  await api.delete(`/auth/admin/users/${id}`);
}

export async function fetchStats() {
  const { data } = await api.get("/admin/stats");
  return data;
}
export async function fetchPublicStats() {
  const { data } = await api.get("/admin/public-stats");
  return data as {
    total_students: number;
    total_instructors: number;
    total_courses: number;
    total_certificates: number;
  };
}
export async function fetchFinancials() {
  const { data } = await api.get("/admin/financials");
  return data;
}
export async function fetchSettings() {
  const { data } = await api.get("/admin/settings");
  return data as Record<string, string>;
}
export async function fetchPublicSettings() {
  const { data } = await api.get("/admin/public-settings");
  return data as Record<string, string>;
}
export async function updateSettings(payload: Record<string, string>) {
  const { data } = await api.post("/admin/settings", payload);
  return data as Record<string, string>;
}
