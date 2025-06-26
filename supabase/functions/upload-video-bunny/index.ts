
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Upload video to Bunny.net function called');

    // For now, return a mock response since we don't have Bunny.net configured
    // In a real implementation, you would:
    // 1. Get the video file from the request
    // 2. Upload it to Bunny.net using their API
    // 3. Return the video ID and playback URL

    const mockResponse = {
      videoId: `mock-${Date.now()}`,
      playbackUrl: 'https://example.com/mock-video.mp4',
      thumbnailUrl: 'https://example.com/mock-thumbnail.jpg',
      duration: 120, // seconds
      success: true
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
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
