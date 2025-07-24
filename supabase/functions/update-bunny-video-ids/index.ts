// v2 - migrado para CUSTOM_SERVICE_KEY + jwtVerify
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jwtVerify } from 'https://deno.land/x/jose@v4.14.6/index.ts';

// Configuração de chaves - prioriza CUSTOM_SERVICE_KEY
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const customServiceKey = Deno.env.get('CUSTOM_SERVICE_KEY');
const legacyServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const jwtSecret = Deno.env.get('JWT_SECRET');

// Log de inicialização
console.log('🔧 [Init] Using service key:', customServiceKey ? 'Present' : 'Missing');
console.log('🔧 [Init] Key source:', customServiceKey ? 'CUSTOM_SERVICE_KEY (NEW)' : 'LEGACY_FALLBACK');
console.log('🔧 [Init] JWT Secret:', jwtSecret ? 'Present' : 'Missing');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
}

serve(async (req) => {
  console.log('🔧 [update-bunny-video-ids] Function called - Method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔧 [update-bunny-video-ids] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      console.error('❌ [update-bunny-video-ids] Invalid method:', req.method);
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

    // Verificar autenticação admin (opcional para esta função utilitária)
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      console.log('🔐 [JWT] Processing admin JWT token for utility function');

      if (jwtSecret) {
        try {
          const secret = new TextEncoder().encode(jwtSecret);
          const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
          console.log('🔐 [JWT] Token verified for admin utility');
          
          const isAdmin = payload.role === 'admin' || payload.is_admin === true;
          if (!isAdmin) {
            console.error('❌ [AUTH] User is not admin for utility function');
            return new Response(JSON.stringify({ error: 'Acesso negado: apenas administradores' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } catch (error) {
          console.error('❌ [JWT] Token verification failed:', error.message);
          return new Response(JSON.stringify({ error: 'Token JWT inválido ou expirado' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Initialize Supabase client with custom service role key
    const supabase = createClient(
      supabaseUrl,
      customServiceKey || legacyServiceKey || ''
    );

    console.log('🔧 [update-bunny-video-ids] Fetching video aulas with missing bunny_video_id');

    // Get all video aulas that are missing bunny_video_id
    const { data: videoAulas, error: fetchError } = await supabase
      .from('video_aulas')
      .select('id, titulo, url_video, id_video_bunny')
      .or('id_video_bunny.is.null,id_video_bunny.eq.');

    if (fetchError) {
      console.error('❌ [update-bunny-video-ids] Error fetching video aulas:', fetchError);
      throw fetchError;
    }

    console.log(`🔧 [update-bunny-video-ids] Found ${videoAulas?.length || 0} video aulas with missing bunny_video_id`);

    if (!videoAulas || videoAulas.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma videoaula com bunny_video_id ausente encontrada',
          updated: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    let updatedCount = 0;
    const results = [];

    // Process each video aula
    for (const videoAula of videoAulas) {
      console.log(`🔧 [update-bunny-video-ids] Processing: ${videoAula.titulo}`);
      
      let extractedGuid = null;

      // Try to extract GUID from URL
      if (videoAula.url_video) {
        const guidRegex = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
        const match = videoAula.url_video.match(guidRegex);
        
        if (match) {
          extractedGuid = match[1];
          console.log(`🔧 [update-bunny-video-ids] Extracted GUID: ${extractedGuid} from URL: ${videoAula.url_video}`);
        }
      }

      if (extractedGuid) {
        // Update the record with the extracted GUID
        const { error: updateError } = await supabase
          .from('video_aulas')
          .update({ id_video_bunny: extractedGuid })
          .eq('id', videoAula.id);

        if (updateError) {
          console.error(`❌ [update-bunny-video-ids] Error updating ${videoAula.titulo}:`, updateError);
          results.push({
            id: videoAula.id,
            titulo: videoAula.titulo,
            success: false,
            error: updateError.message
          });
        } else {
          console.log(`✅ [update-bunny-video-ids] Updated ${videoAula.titulo} with GUID: ${extractedGuid}`);
          updatedCount++;
          results.push({
            id: videoAula.id,
            titulo: videoAula.titulo,
            success: true,
            bunny_video_id: extractedGuid
          });
        }
      } else {
        console.log(`⚠️ [update-bunny-video-ids] No GUID found in URL for: ${videoAula.titulo}`);
        results.push({
          id: videoAula.id,
          titulo: videoAula.titulo,
          success: false,
          error: 'Nenhum GUID encontrado na URL'
        });
      }
    }

    console.log(`🔧 [update-bunny-video-ids] Process completed. Updated ${updatedCount} records`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processo concluído. ${updatedCount} registros atualizados.`,
        updated: updatedCount,
        total: videoAulas.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ [update-bunny-video-ids] Unexpected error:', error);
    
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