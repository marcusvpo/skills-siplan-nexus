
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { videoAulaId, progressoSegundos, completo, cartorioId } = await req.json()

    console.log('🎯 [mark-lesson-progress] Received request:', {
      videoAulaId,
      progressoSegundos,
      completo,
      cartorioId: cartorioId ? 'present' : 'missing'
    })

    // Validar dados obrigatórios
    if (!videoAulaId || !cartorioId) {
      console.error('❌ [mark-lesson-progress] Missing required fields')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'videoAulaId e cartorioId são obrigatórios' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se a videoaula existe
    const { data: videoAula, error: videoError } = await supabaseClient
      .from('video_aulas')
      .select('id, titulo')
      .eq('id', videoAulaId)
      .single()

    if (videoError || !videoAula) {
      console.error('❌ [mark-lesson-progress] Video aula not found:', videoError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Videoaula não encontrada' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se o cartório existe
    const { data: cartorio, error: cartorioError } = await supabaseClient
      .from('cartorios')
      .select('id, nome')
      .eq('id', cartorioId)
      .single()

    if (cartorioError || !cartorio) {
      console.error('❌ [mark-lesson-progress] Cartorio not found:', cartorioError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cartório não encontrado' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Preparar dados para upsert
    const progressData = {
      video_aula_id: videoAulaId,
      cartorio_id: cartorioId,
      progresso_segundos: progressoSegundos || 0,
      completo: completo || false,
    }

    console.log('💾 [mark-lesson-progress] Upserting progress data:', progressData)

    // Fazer upsert na tabela de visualizações
    const { data: result, error: upsertError } = await supabaseClient
      .from('visualizacoes_cartorio')
      .upsert(progressData, {
        onConflict: 'video_aula_id,cartorio_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (upsertError) {
      console.error('❌ [mark-lesson-progress] Upsert error:', upsertError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao salvar progresso: ${upsertError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ [mark-lesson-progress] Progress saved successfully:', {
      id: result.id,
      completo: result.completo,
      progresso_segundos: result.progresso_segundos
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        message: completo ? 'Aula marcada como concluída!' : 'Progresso salvo!'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [mark-lesson-progress] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
