import { api } from "./api";
import type { Book } from "../types";

export async function fetchBooks(params: { category_id?: string; search?: string; is_free?: "true" } = {}) {
  const { data } = await api.get("/books/", { params });
  return data as Book[];
}
export async function fetchBook(id: string) {
  const { data } = await api.get(`/books/${id}`);
  return data as Book;
}
export async function createBook(payload: Partial<Book>) {
  const { data } = await api.post("/books/", payload);
  return data as Book;
}
export async function updateBook(id: string, payload: Partial<Book>) {
  const { data } = await api.put(`/books/${id}`, payload);
  return data as Book;
}
export async function deleteBook(id: string) {
  await api.delete(`/books/${id}`);
}
export async function uploadBookFiles(id: string, files: { file?: File; cover?: File }) {
  const form = new FormData();
  if (files.file) form.append("file", files.file);
  if (files.cover) form.append("cover", files.cover);
  const { data } = await api.post(`/books/${id}/upload`, form);
  return data as Book;
}
export async function downloadBook(id: string) {
  const { data } = await api.get(`/books/${id}/download`);
  return data.file_path as string;
}
