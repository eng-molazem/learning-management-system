import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import { useAuth } from "../contexts/AuthContext";
import { createPost, fetchPosts, toggleLike } from "../services/community";

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function Community() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: posts = [], isLoading } = useQuery({ queryKey: ["community", "posts"], queryFn: () => fetchPosts() });

  const submitPost = async () => {
    if (!title.trim() || !content.trim()) return;
    await createPost(title, content);
    setTitle("");
    setContent("");
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["community", "posts"] });
  };

  const handleLike = async (postId: string) => {
    await toggleLike(postId);
    qc.invalidateQueries({ queryKey: ["community", "posts"] });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("community.title")}</h1>
        {user && (
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" /> {t("community.newPost")}
          </Button>
        )}
      </div>

      {showForm && (
        <GlassCard className="mb-6 space-y-3">
          <input
            className="input-glass"
            placeholder={t("community.postTitle") as string}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="input-glass resize-none"
            rows={4}
            placeholder={t("community.postContent") as string}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button onClick={submitPost}>{t("community.newPost")}</Button>
        </GlassCard>
      )}

      {isLoading ? (
        <p className="text-center text-muted">{t("common.loading")}</p>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <GlassCard key={p.id}>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-nebula-purple to-nebula-cyan text-xs font-bold text-white">
                  {p.author?.name?.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-medium">{p.author?.name}</p>
                  <p className="text-[10px] text-muted">{timeAgo(p.created_at)}</p>
                </div>
              </div>
              <Link to={`/community/${p.id}`}>
                <h3 className="mb-1 font-semibold hover:text-nebula-violet">{p.title}</h3>
                <p className="line-clamp-2 text-sm text-muted">{p.content}</p>
              </Link>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted">
                <button
                  onClick={() => handleLike(p.id)}
                  className={`flex items-center gap-1 ${p.liked_by_me ? "text-nebula-pink" : ""}`}
                >
                  <Heart className={`h-4 w-4 ${p.liked_by_me ? "fill-nebula-pink" : ""}`} /> {p.like_count}
                </button>
                <Link to={`/community/${p.id}`} className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" /> {p.comment_count}
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
