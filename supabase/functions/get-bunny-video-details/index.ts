import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, getServiceSupabase, jsonResponse, requireCartorioOrAdmin } from "./security.ts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido. Use POST.", success: false }, 405);
  }

  try {
    const supabase = getServiceSupabase();
    const actor = await requireCartorioOrAdmin(req, supabase);
    if (actor instanceof Response) return actor;

    const requestBody = await req.json().catch(() => null);
    const videoId = typeof requestBody?.videoId === "string" ? requestBody.videoId.trim() : "";

    if (!videoId || !UUID_REGEX.test(videoId)) {
      return jsonResponse({ error: "ID do vídeo inválido", success: false }, 400);
    }

    const BUNNY_VIDEO_LIBRARY_API_KEY = Deno.env.get("BUNNY_API_KEY");
    const LIBRARY_ID = "467408";
    const CDN_HOSTNAME = "vz-f849dcb4-55a.b-cdn.net";

    if (!BUNNY_VIDEO_LIBRARY_API_KEY) {
      return jsonResponse({ error: "Configuração da API de vídeo indisponível.", success: false }, 500);
    }

    const bunnyApiUrl = `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`;
    const response = await fetch(bunnyApiUrl, {
      method: "GET",
      headers: {
        AccessKey: BUNNY_VIDEO_LIBRARY_API_KEY,
        accept: "application/json",
        "User-Agent": "Siplan-Skills/1.0",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return jsonResponse({ error: "Vídeo não encontrado na biblioteca.", success: false }, 404);
      }
      return jsonResponse({ error: "Falha ao consultar serviço de vídeo.", success: false }, 502);
    }

    const videoData = await response.json();
    const playUrl = `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoData.guid}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;
    const thumbnailUrl =
      videoData.thumbnailCount > 0
        ? `https://${CDN_HOSTNAME}/${videoData.guid}/${videoData.thumbnailFileName}`
        : null;

    return jsonResponse({
      success: true,
      videoId: videoData.guid,
      title: videoData.title,
      playUrl,
      thumbnailUrl,
      duration: videoData.length,
      status: videoData.status,
      encodeProgress: videoData.encodeProgress,
      isPublic: videoData.isPublic,
      resolution: {
        width: videoData.width,
        height: videoData.height,
      },
      uploadDate: videoData.dateUploaded,
      views: videoData.views,
      storageSize: videoData.storageSize,
    });
  } catch (error) {
    console.error("[get-bunny-video-details] Error:", error);
    return jsonResponse({ error: "Erro interno do servidor", success: false }, 500);
  }
});
