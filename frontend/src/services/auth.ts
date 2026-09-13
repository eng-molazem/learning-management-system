import { api, clearTokens, setTokens } from "./api";
import type { Role, User } from "../types";

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  role: Role;
  lang_pref: "ar" | "en";
}) {
  const { data } = await api.post("/auth/register", payload);
  setTokens(data.access, data.refresh);
  return data.user as User;
}

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  setTokens(data.access, data.refresh);
  return data.user as User;
}

export function logout() {
  clearTokens();
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  return data as User;
}

export async function updateProfile(payload: Partial<Pick<User, "name" | "bio" | "lang_pref">>) {
  const { data } = await api.put("/auth/me", payload);
  return data as User;
}

export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append("avatar", file);
  const { data } = await api.post("/auth/me/avatar", form);
  return data.avatar as string;
}
