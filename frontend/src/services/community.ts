import { api } from "./api";
import type { CommunityPost } from "../types";

export async function fetchPosts(params: { search?: string; tag?: string } = {}) {
  const { data } = await api.get("/community/posts", { params });
  return data as CommunityPost[];
}
export async function fetchPost(id: string) {
  const { data } = await api.get(`/community/posts/${id}`);
  return data as CommunityPost;
}
export async function createPost(title: string, content: string, tags: string[] = []) {
  const { data } = await api.post("/community/posts", { title, content, tags });
  return data as CommunityPost;
}
export async function deletePost(id: string) {
  await api.delete(`/community/posts/${id}`);
}
export async function addComment(postId: string, content: string) {
  const { data } = await api.post(`/community/posts/${postId}/comments`, { content });
  return data;
}
export async function deleteComment(id: string) {
  await api.delete(`/community/comments/${id}`);
}
export async function toggleLike(postId: string) {
  const { data } = await api.post(`/community/posts/${postId}/like`);
  return data as { liked: boolean; like_count: number };
}
