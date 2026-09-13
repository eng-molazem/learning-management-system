import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import { useAuth } from "../contexts/AuthContext";
import { addComment, deleteComment, deletePost, fetchPost, toggleLike } from "../services/community";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: post, isLoading } = useQuery({
    queryKey: ["community", "post", id],
    queryFn: () => fetchPost(id!),
    enabled: !!id,
  });

  if (isLoading || !post) return <p className="text-center text-muted">{t("common.loading")}</p>;

  const canManagePost = user && (user.id === post.user_id || user.role === "admin");

  const submitComment = async () => {
    if (!comment.trim()) return;
    await addComment(post.id, comment);
    setComment("");
    qc.invalidateQueries({ queryKey: ["community", "post", id] });
  };

  const handleLike = async () => {
    await toggleLike(post.id);
    qc.invalidateQueries({ queryKey: ["community", "post", id] });
  };

  const handleDeletePost = async () => {
    await deletePost(post.id);
    navigate("/community");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <GlassCard className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-nebula-purple to-nebula-cyan text-sm font-bold text-white">
              {post.author?.name?.charAt(0)}
            </span>
            <span className="font-medium">{post.author?.name}</span>
          </div>
          {canManagePost && (
            <button onClick={handleDeletePost} className="btn-ghost !p-2 text-red-300">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <h1 className="mb-2 text-2xl font-bold">{post.title}</h1>
        <p className="whitespace-pre-wrap text-muted">{post.content}</p>
        <button
          onClick={handleLike}
          className={`mt-4 flex items-center gap-1 text-sm ${post.liked_by_me ? "text-nebula-pink" : "text-muted"}`}
        >
          <Heart className={`h-4 w-4 ${post.liked_by_me ? "fill-nebula-pink" : ""}`} /> {post.like_count}
        </button>
      </GlassCard>

      <h2 className="mb-3 font-semibold">{t("community.comments")} ({post.comments?.length ?? 0})</h2>
      {user && (
        <GlassCard className="mb-4 flex gap-2">
          <input
            className="input-glass"
            placeholder={t("community.addComment") as string}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
          />
          <Button onClick={submitComment}>{t("common.add")}</Button>
        </GlassCard>
      )}
      <div className="space-y-3">
        {post.comments?.map((c) => (
          <GlassCard key={c.id} className="flex items-start justify-between !p-3">
            <div className="flex items-start gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                {c.author?.name?.charAt(0)}
              </span>
              <div>
                <p className="text-sm font-medium">{c.author?.name}</p>
                <p className="text-sm text-muted">{c.content}</p>
              </div>
            </div>
            {user && (user.id === c.user_id || user.role === "admin") && (
              <button
                onClick={async () => {
                  await deleteComment(c.id);
                  qc.invalidateQueries({ queryKey: ["community", "post", id] });
                }}
                className="btn-ghost !p-1.5 text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
