import { api } from "./api";
import type { Enrollment, LeaderboardEntry } from "../types";

export async function enroll(courseId: string, paymentId?: string) {
  const { data } = await api.post("/enrollments/", { course_id: courseId, payment_id: paymentId });
  return data;
}

export async function fetchMyEnrollments() {
  const { data } = await api.get("/enrollments/me");
  return data as Enrollment[];
}

export async function completeLesson(lessonId: string) {
  const { data } = await api.post("/enrollments/complete-lesson", { lesson_id: lessonId });
  return data as { progress: number; completed: boolean; needs_exam: boolean };
}

export async function submitExam(courseId: string, answers: number[]) {
  const { data } = await api.post("/enrollments/submit-exam", { course_id: courseId, answers });
  return data as { score: number; passed: boolean };
}

export async function fetchLeaderboard() {
  const { data } = await api.get("/enrollments/leaderboard");
  return data as LeaderboardEntry[];
}

export async function announceCourse(courseId: string, title: string, message: string) {
  const { data } = await api.post(`/enrollments/courses/${courseId}/announce`, { title, message });
  return data;
}

export async function fetchInstructorSummary() {
  const { data } = await api.get("/enrollments/instructor/summary");
  return data as { total_courses: number; total_students: number; total_revenue: number };
}
