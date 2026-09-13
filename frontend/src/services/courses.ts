import { api } from "./api";
import type { Category, Course, CourseDetail, Path } from "../types";

export async function fetchCategories() {
  const { data } = await api.get("/categories");
  return data as Category[];
}
export async function createCategory(payload: Partial<Category>) {
  const { data } = await api.post("/categories", payload);
  return data as Category;
}
export async function updateCategory(id: string, payload: Partial<Category>) {
  const { data } = await api.put(`/categories/${id}`, payload);
  return data as Category;
}
export async function deleteCategory(id: string) {
  await api.delete(`/categories/${id}`);
}

export async function fetchPaths() {
  const { data } = await api.get("/paths");
  return data as Path[];
}
export async function fetchPath(id: string) {
  const { data } = await api.get(`/paths/${id}`);
  return data as Path;
}
export async function createPath(payload: Partial<Path> & { course_ids?: string[] }) {
  const { data } = await api.post("/paths", payload);
  return data as Path;
}
export async function updatePath(id: string, payload: Partial<Path> & { course_ids?: string[] }) {
  const { data } = await api.put(`/paths/${id}`, payload);
  return data as Path;
}
export async function deletePath(id: string) {
  await api.delete(`/paths/${id}`);
}

export interface CourseQuery {
  category_id?: string;
  path_id?: string;
  level?: string;
  language?: string;
  is_free?: "true" | "false";
  search?: string;
  sort?: string;
  page?: number;
  page_size?: number;
  mine?: "true";
  all?: "true";
}

export async function fetchCourses(query: CourseQuery = {}) {
  const { data } = await api.get("/courses", { params: query });
  return data as { results: Course[]; total: number; page: number; page_size: number };
}

export async function fetchCourse(id: string) {
  const { data } = await api.get(`/courses/${id}`);
  return data as CourseDetail;
}

export async function createCourse(payload: Partial<Course>) {
  const { data } = await api.post("/courses", payload);
  return data as Course;
}
export async function updateCourse(id: string, payload: Partial<Course>) {
  const { data } = await api.put(`/courses/${id}`, payload);
  return data as Course;
}
export async function deleteCourse(id: string) {
  await api.delete(`/courses/${id}`);
}

export async function fetchCurriculum(courseId: string) {
  const { data } = await api.get(`/courses/${courseId}/curriculum`);
  return data as { course: Course; modules: any[] };
}

export async function saveCurriculum(
  courseId: string,
  payload: { modules: any[]; lessons: any[]; exam?: { questions: any[] } }
) {
  const { data } = await api.put(`/courses/${courseId}/curriculum`, payload);
  return data as { course: Course; modules: any[] };
}

export async function uploadLessonVideo(lessonId: string, file: File) {
  const form = new FormData();
  form.append("video", file);
  const { data } = await api.post(`/lessons/${lessonId}/video`, form);
  return data.video_file_path as string;
}

export async function fetchReviews(courseId: string) {
  const { data } = await api.get(`/courses/${courseId}/reviews`);
  return data;
}
export async function submitReview(courseId: string, rating: number, comment: string) {
  const { data } = await api.post(`/courses/${courseId}/reviews`, { rating, comment });
  return data;
}
