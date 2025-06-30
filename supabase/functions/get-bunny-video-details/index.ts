
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
  console.log('🎥 [get-bunny-video-details] Function called - Method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🎥 [get-bunny-video-details] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      console.error('❌ [get-bunny-video-details] Invalid method:', req.method);
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

    // Get and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('🎥 [get-bunny-video-details] Request body received:', requestBody);
    } catch (error) {
      console.error('❌ [get-bunny-video-details] Invalid JSON in request body:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Corpo da requisição deve ser um JSON válido',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { videoId } = requestBody;

    // Validate videoId
    if (!videoId || typeof videoId !== 'string') {
      console.error('❌ [get-bunny-video-details] Invalid videoId:', videoId);
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

    // Get Bunny.net credentials from environment
    const BUNNY_VIDEO_LIBRARY_API_KEY = Deno.env.get('BUNNY_API_KEY');
    const LIBRARY_ID = '461543';
    const CDN_HOSTNAME = 'vz-2e72e0ff-de5.b-cdn.net';

    console.log('🔑 [get-bunny-video-details] Environment check - API Key exists:', !!BUNNY_VIDEO_LIBRARY_API_KEY);
    console.log('📚 [get-bunny-video-details] Using Library ID:', LIBRARY_ID);

    if (!BUNNY_VIDEO_LIBRARY_API_KEY) {
      console.error('❌ [get-bunny-video-details] BUNNY_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ 
          error: 'Configuração da API Bunny.net (Video Library) não encontrada. Verifique se o secret BUNNY_API_KEY está configurado.',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Make request to Bunny.net Video Library API
    const bunnyApiUrl = `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`;
    
    console.log('📡 [get-bunny-video-details] Making request to:', bunnyApiUrl);
    console.log('🔐 [get-bunny-video-details] Using API Key (first 10 chars):', BUNNY_VIDEO_LIBRARY_API_KEY.substring(0, 10) + '...');

    const response = await fetch(bunnyApiUrl, {
      method: 'GET',
      headers: {
        'AccessKey': BUNNY_VIDEO_LIBRARY_API_KEY,
        'accept': 'application/json',
        'User-Agent': 'Siplan-Skills/1.0'
      }
    });

    console.log('📡 [get-bunny-video-details] Bunny.net API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [get-bunny-video-details] Bunny.net API error:', { 
        status: response.status, 
        statusText: response.statusText,
        errorText,
        url: bunnyApiUrl,
        apiKeyPrefix: BUNNY_VIDEO_LIBRARY_API_KEY.substring(0, 10) + '...'
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
            error: 'Erro de autenticação com a API da Bunny.net. Verifique se a API Key da Video Library está configurada corretamente no secret BUNNY_API_KEY.',
            success: false,
            debug: {
              status: response.status,
              apiKeyPrefix: BUNNY_VIDEO_LIBRARY_API_KEY.substring(0, 10) + '...',
              expectedKey: '0f94a759-6635-403e-89b3fb1c6aa3-700f-4c4e'
            }
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
    
    console.log('✅ [get-bunny-video-details] Video data received successfully:', {
      guid: videoData.guid,
      title: videoData.title,
      status: videoData.status,
      encodeProgress: videoData.encodeProgress,
      library: LIBRARY_ID
    });

    // Generate URLs using correct CDN
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

    console.log('📤 [get-bunny-video-details] Returning successful result');

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
