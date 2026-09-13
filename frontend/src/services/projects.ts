import { api } from "./api";
import type { Project } from "../types";

export async function fetchProjects(params: { search?: string } = {}) {
  const { data } = await api.get("/projects/", { params });
  return data as Project[];
}
export async function fetchProject(id: string) {
  const { data } = await api.get(`/projects/${id}`);
  return data as Project;
}
export async function createProject(payload: Partial<Project>) {
  const { data } = await api.post("/projects/", payload);
  return data as Project;
}
export async function updateProject(id: string, payload: Partial<Project>) {
  const { data } = await api.put(`/projects/${id}`, payload);
  return data as Project;
}
export async function deleteProject(id: string) {
  await api.delete(`/projects/${id}`);
}
export async function uploadProjectFiles(id: string, files: { file?: File; thumbnail?: File }) {
  const form = new FormData();
  if (files.file) form.append("file", files.file);
  if (files.thumbnail) form.append("thumbnail", files.thumbnail);
  const { data } = await api.post(`/projects/${id}/upload`, form);
  return data as Project;
}
export async function downloadProject(id: string) {
  const { data } = await api.get(`/projects/${id}/download`);
  return data.file_path as string;
}
