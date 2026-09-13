import { api } from "./api";
import type { Certificate } from "../types";

export async function fetchMyCertificates() {
  const { data } = await api.get("/certificates/me");
  return data as Certificate[];
}

export async function verifyCertificate(code: string) {
  const { data } = await api.get(`/certificates/verify/${code}`);
  return data as Certificate;
}

export async function fetchAllCertificatesAdmin() {
  const { data } = await api.get("/certificates/admin/all");
  return data;
}
