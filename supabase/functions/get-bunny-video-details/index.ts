
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.14.6/index.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
}

async function isAuthorizedCaller(req: Request): Promise<boolean> {
  const customHeader = req.headers.get('x-custom-auth');
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  const candidate = customHeader || authHeader;
  if (!candidate) return false;

  const rawToken = candidate.replace(/^Bearer\s+/i, '').trim();
  if (!rawToken || rawToken.startsWith('sb_publishable_')) return false;

  // 1. Token legado CART- ou JWT customizado de cartório
  if (rawToken.startsWith('CART-')) {
    try {
      const decoded = JSON.parse(atob(rawToken.replace('CART-', '')));
      if (decoded?.cartorio_id) return true;
    } catch {
      return false;
    }
  }

  const jwtSecret = Deno.env.get('JWT_SECRET');
  if (jwtSecret) {
    try {
      const { payload } = await jwtVerify(rawToken, new TextEncoder().encode(jwtSecret));
      if (payload?.cartorio_id) return true;
    } catch {
      // Pode ser um JWT do Supabase Auth (administrador); segue para verificação abaixo
    }
  }

  // 2. Fallback: sessão de administrador via Supabase Auth
  if (authHeader?.startsWith('Bearer ')) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('CUSTOM_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user?.email) {
        const { data: admin } = await supabase
          .from('admins')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
        if (admin) return true;
      }
    }
  }

  return false;
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

    // Require authenticated cartório or admin caller
    const authorized = await isAuthorizedCaller(req);
    if (!authorized) {
      return new Response(
        JSON.stringify({
          error: 'Não autorizado. Faça login para acessar os detalhes do vídeo.',
          success: false,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
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

    // Get Bunny.net credentials from environment - UPDATED FOR NEW ACCOUNT
    const BUNNY_VIDEO_LIBRARY_API_KEY = Deno.env.get('BUNNY_API_KEY');
    const LIBRARY_ID = '467408';
    const CDN_HOSTNAME = 'vz-f849dcb4-55a.b-cdn.net';

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
            error: 'Erro de autenticação com a API da Bunny.net. Verifique se o secret BUNNY_API_KEY está configurado corretamente.',
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
    
    console.log('✅ [get-bunny-video-details] Video data received successfully:', {
      guid: videoData.guid,
      title: videoData.title,
      status: videoData.status,
      encodeProgress: videoData.encodeProgress,
      library: LIBRARY_ID
    });

    // Generate URLs - Use correct embed URL format with parameters
    const playUrl = `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoData.guid}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;
    const thumbnailUrl = videoData.thumbnailCount > 0 
      ? `https://${CDN_HOSTNAME}/${videoData.guid}/${videoData.thumbnailFileName}`
      : null;

    console.log('🎬 [get-bunny-video-details] Generated embed playUrl:', playUrl);

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
