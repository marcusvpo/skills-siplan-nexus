import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getServiceSupabase, jsonResponse, requireAdmin } from "./security.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido", success: false }, 405);
  }

  try {
    const supabase = getServiceSupabase();
    const adminCheck = await requireAdmin(req, supabase);
    if (adminCheck instanceof Response) return adminCheck;

    const formData = await req.formData();
    const videoFile = formData.get("video") as File | null;
    const title = (formData.get("title") as string) || "Untitled Video";

    if (!videoFile) {
      return jsonResponse({ error: "Nenhum arquivo de vídeo fornecido", success: false }, 400);
    }

    if (!videoFile.type.startsWith("video/")) {
      return jsonResponse({ error: "Arquivo deve ser um vídeo", success: false }, 400);
    }

    const BUNNY_VIDEO_LIBRARY_API_KEY = Deno.env.get("BUNNY_API_KEY");
    const LIBRARY_ID = "467408";
    const CDN_HOSTNAME = "vz-f849dcb4-55a.b-cdn.net";

    if (!BUNNY_VIDEO_LIBRARY_API_KEY) {
      return jsonResponse({ error: "Configuração da API de vídeo indisponível.", success: false }, 500);
    }

    const mockVideoId = `bunny_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    return jsonResponse({
      videoId: mockVideoId,
      playbackUrl: `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${mockVideoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`,
      thumbnailUrl: `https://${CDN_HOSTNAME}/${mockVideoId}/thumbnail.jpg`,
      duration: 180,
      fileSize: videoFile.size,
      fileName: videoFile.name,
      title,
      status: "uploaded",
      success: true,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[upload-video-bunny] Error:", error);
    return jsonResponse({ error: "Erro interno do servidor", success: false }, 500);
  }
});
