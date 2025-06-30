
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BunnyVideoResponse {
  guid: string;
  title: string;
  dateUploaded: string;
  views: number;
  isPublic: boolean;
  length: number;
  status: number;
  framerate: number;
  rotation: number;
  width: number;
  height: number;
  availableResolutions: string;
  thumbnailCount: number;
  encodeProgress: number;
  storageSize: number;
  captions: any[];
  hasMP4Fallback: boolean;
  collectionId: string;
  thumbnailFileName: string;
  averageWatchTime: number;
  totalWatchTime: number;
  category: string;
  chapters: any[];
  moments: any[];
  metaTags: any[];
  transcodingMessages: any[];
}

serve(async (req) => {
  console.log('🎥 [get-bunny-video-details] Function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          error: 'Método não permitido. Use POST.',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405,
        }
      );
    }

    // Get request body
    const { videoId } = await req.json();

    console.log('🎥 [get-bunny-video-details] Received request:', { videoId });

    // Validate videoId
    if (!videoId || typeof videoId !== 'string') {
      return new Response(
        JSON.stringify({ 
          error: 'ID do vídeo é obrigatório e deve ser uma string',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Get Bunny.net credentials from environment - USANDO A API KEY DA BIBLIOTECA DE VÍDEOS
    const BUNNY_VIDEO_LIBRARY_API_KEY = Deno.env.get('BUNNY_API_KEY');
    const LIBRARY_ID = '461543';
    const CDN_HOSTNAME = 'vz-2e72e0ff-de5.b-cdn.net';

    if (!BUNNY_VIDEO_LIBRARY_API_KEY) {
      console.error('❌ [get-bunny-video-details] BUNNY_API_KEY (Video Library) not found in environment');
      return new Response(
        JSON.stringify({ 
          error: 'Configuração da API Bunny.net (Video Library) não encontrada',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log('🔑 [get-bunny-video-details] Making request to Bunny.net Video Library API');
    console.log('📚 [get-bunny-video-details] Using Library ID:', LIBRARY_ID);

    // Make request to Bunny.net Video Library API com a API Key CORRETA
    const bunnyApiUrl = `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`;
    
    const response = await fetch(bunnyApiUrl, {
      method: 'GET',
      headers: {
        'AccessKey': BUNNY_VIDEO_LIBRARY_API_KEY, // USANDO A API KEY DA BIBLIOTECA
        'accept': 'application/json'
      }
    });

    console.log('📡 [get-bunny-video-details] Bunny.net API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [get-bunny-video-details] Bunny.net API error:', { 
        status: response.status, 
        statusText: response.statusText,
        errorText,
        url: bunnyApiUrl
      });

      if (response.status === 404) {
        return new Response(
          JSON.stringify({ 
            error: 'Vídeo não encontrado na Bunny.net. Verifique o ID do vídeo.',
            success: false 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          }
        );
      }

      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ 
            error: 'Erro de autenticação com a API da Bunny.net. Verifique se a API Key da Video Library está configurada corretamente.',
            success: false 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Erro da API Bunny.net (${response.status}): ${errorText}`,
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status,
        }
      );
    }

    const videoData: BunnyVideoResponse = await response.json();
    
    console.log('✅ [get-bunny-video-details] Video data received:', {
      guid: videoData.guid,
      title: videoData.title,
      status: videoData.status,
      encodeProgress: videoData.encodeProgress,
      library: LIBRARY_ID
    });

    // Generate URLs usando o CDN correto
    const playUrl = `https://${CDN_HOSTNAME}/${videoData.guid}/playlist.m3u8`;
    const thumbnailUrl = videoData.thumbnailCount > 0 
      ? `https://${CDN_HOSTNAME}/${videoData.guid}/${videoData.thumbnailFileName}`
      : null;

    // Return formatted response
    const result = {
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
        height: videoData.height
      },
      uploadDate: videoData.dateUploaded,
      views: videoData.views,
      storageSize: videoData.storageSize
    };

    console.log('📤 [get-bunny-video-details] Returning result:', {
      success: result.success,
      title: result.title.substring(0, 50) + '...',
      hasPlayUrl: !!result.playUrl,
      hasThumbnailUrl: !!result.thumbnailUrl,
      library: LIBRARY_ID
    });

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ [get-bunny-video-details] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        details: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
