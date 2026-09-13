import { mediaUrl } from "../services/api";

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{6,})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

interface Props {
  videoType: "youtube" | "upload" | "none";
  videoUrl?: string | null;
  videoFilePath?: string | null;
}

export default function VideoPlayer({ videoType, videoUrl, videoFilePath }: Props) {
  if (videoType === "youtube" && videoUrl) {
    const id = extractYoutubeId(videoUrl);
    if (id) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${id}`}
            title="Lesson video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }

  if (videoType === "upload" && videoFilePath) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video className="h-full w-full" src={mediaUrl(videoFilePath)} controls />
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-muted">
      No video
    </div>
  );
}
