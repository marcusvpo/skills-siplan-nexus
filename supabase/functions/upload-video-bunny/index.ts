
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Upload video to Bunny.net function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405,
        }
      );
    }

    // Get the form data
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;
    const title = formData.get('title') as string;

    console.log('Received file:', {
      fileName: videoFile?.name,
      fileSize: videoFile?.size,
      fileType: videoFile?.type,
      title: title
    });

    // Validate file
    if (!videoFile) {
      return new Response(
        JSON.stringify({ 
          error: 'Nenhum arquivo de vídeo fornecido',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Validate file type
    if (!videoFile.type.startsWith('video/')) {
      return new Response(
        JSON.stringify({ 
          error: 'Arquivo deve ser um vídeo',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // UPDATED FOR NEW BUNNY.NET ACCOUNT
    const BUNNY_VIDEO_LIBRARY_API_KEY = Deno.env.get('BUNNY_API_KEY');
    const LIBRARY_ID = '467408';
    const CDN_HOSTNAME = 'vz-f849dcb4-55a.b-cdn.net';

    console.log('🔑 [upload-video-bunny] Environment check - API Key exists:', !!BUNNY_VIDEO_LIBRARY_API_KEY);
    console.log('📚 [upload-video-bunny] Using Library ID:', LIBRARY_ID);

    if (!BUNNY_VIDEO_LIBRARY_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'Configuração da API Bunny.net não encontrada. Verifique se o secret BUNNY_API_KEY está configurado.',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // TODO: Integrate with Bunny.net API
    // For now, return a mock response with enhanced data
    // In a real implementation, you would:
    // 1. Upload the video file to Bunny.net
    // 2. Get the video ID and URLs from Bunny.net response
    // 3. Return the actual data

    // Generate a more realistic mock ID
    const mockVideoId = `bunny_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockResponse = {
      videoId: mockVideoId,
      playbackUrl: `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${mockVideoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`,
      thumbnailUrl: `https://${CDN_HOSTNAME}/${mockVideoId}/thumbnail.jpg`,
      duration: Math.floor(Math.random() * 600) + 60, // Random duration between 1-10 minutes
      fileSize: videoFile.size,
      fileName: videoFile.name,
      title: title || 'Untitled Video',
      status: 'uploaded',
      success: true,
      uploadedAt: new Date().toISOString()
    };

    console.log('Returning mock response:', mockResponse);

    return new Response(
      JSON.stringify(mockResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in upload-video-bunny function:', error);
    
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
