import React, { useEffect, useState } from 'react';

const FUNCTION_URL = 'https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/get-bunny-video-details';
const CDN_HOSTNAME = 'vz-f849dcb4-55a.b-cdn.net';

// Cache de thumbs por videoId (evita múltiplas chamadas à API da Bunny)
const thumbCache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

const fetchThumb = (videoId: string): Promise<string | null> => {
  if (thumbCache.has(videoId)) return Promise.resolve(thumbCache.get(videoId) ?? null);
  if (inflight.has(videoId)) return inflight.get(videoId)!;

  const promise = fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId }),
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: any) => {
      const url =
        data?.thumbnailUrl || (data?.videoId ? `https://${CDN_HOSTNAME}/${data.videoId}/thumbnail.jpg` : null);
      thumbCache.set(videoId, url ?? null);
      return url ?? null;
    })
    .catch(() => {
      thumbCache.set(videoId, null);
      return null;
    })
    .finally(() => {
      inflight.delete(videoId);
    });

  inflight.set(videoId, promise);
  return promise;
};

interface BunnyThumbnailProps {
  videoId?: string | null;
  /** Thumb já salva no banco (usada como valor inicial/fallback) */
  fallbackUrl?: string | null;
  alt: string;
  className?: string;
}

/**
 * Busca a thumb exata do vídeo na Bunny.net pelo ID (mesma função usada no
 * cadastro de videoaula) e renderiza a imagem quando disponível.
 */
export const BunnyThumbnail: React.FC<BunnyThumbnailProps> = ({ videoId, fallbackUrl, alt, className }) => {
  const [src, setSrc] = useState<string | null>(fallbackUrl || null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!videoId) {
      setSrc(fallbackUrl || null);
      return;
    }
    setFailed(false);
    setSrc(fallbackUrl || `https://${CDN_HOSTNAME}/${videoId}/thumbnail.jpg`);
    fetchThumb(videoId).then((url) => {
      if (active && url) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [videoId, fallbackUrl]);

  if (!src || failed) return null;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
