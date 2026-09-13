import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({ baseURL: API_URL });

const ACCESS_KEY = "horizon_access";
const REFRESH_KEY = "horizon_refresh";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}
export function setTokens(access: string, refresh?: string) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return !payload.exp || payload.exp * 1000 < Date.now() + 5000;
  } catch {
    return true;
  }
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  // The backend authenticates the bearer token *before* checking a view's
  // permission class, so attaching an expired token would 401 even public
  // (AllowAny) endpoints like the courses list or login itself. Skip it
  // client-side instead — the response interceptor below still refreshes
  // and retries for endpoints that actually need auth.
  if (token && config.headers && !isExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh });
    setTokens(data.access);
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry && getRefreshToken()) {
      original._retry = true;
      if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => (refreshPromise = null));
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as any).Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(err: unknown, fallback = "حدث خطأ ما"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as any;
    if (data?.detail) return data.detail;
    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      if (Array.isArray(first)) return String(first[0]);
    }
    if (typeof data === "string") return data;
  }
  return fallback;
}

export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = API_URL.replace(/\/api\/?$/, "");
  return `${base}${path}`;
}
