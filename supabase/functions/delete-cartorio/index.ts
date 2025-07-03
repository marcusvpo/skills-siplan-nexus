import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    const { cartorioId } = await req.json()

    console.log('🗑️ [delete-cartorio] Delete request for:', cartorioId)

    if (!cartorioId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'cartorioId é obrigatório' 
        }),
        { 
          status: 400, 
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
      console.error('❌ [delete-cartorio] Cartorio not found:', cartorioError)
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

    // Deletar o cartório (CASCADE vai cuidar das dependências)
    const { error: deleteError } = await supabaseClient
      .from('cartorios')
      .delete()
      .eq('id', cartorioId)

    if (deleteError) {
      console.error('❌ [delete-cartorio] Delete error:', deleteError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao deletar cartório: ${deleteError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ [delete-cartorio] Cartorio deleted successfully:', cartorio.nome)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cartório "${cartorio.nome}" deletado com sucesso!` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [delete-cartorio] Unexpected error:', error)
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
