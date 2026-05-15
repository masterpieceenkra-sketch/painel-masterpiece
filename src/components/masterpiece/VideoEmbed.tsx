interface Props {
  url: string;
  title?: string;
}

function toEmbedUrl(url: string): string {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Default — assume already an embed URL
  return url;
}

export function VideoEmbed({ url, title }: Props) {
  return (
    <div className="my-8">
      {title && (
        <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[var(--muted)]">
          {title}
        </div>
      )}
      <div className="relative w-full overflow-hidden rounded-sm border border-[var(--border)] bg-black" style={{ aspectRatio: "16 / 9" }}>
        <iframe
          src={toEmbedUrl(url)}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
