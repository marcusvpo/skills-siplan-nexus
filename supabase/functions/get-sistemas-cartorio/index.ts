
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const url = new URL(req.url)
    const cartorioId = url.searchParams.get('cartorioId')

    console.log('🎯 [get-sistemas-cartorio] Sistemas request for cartorio:', cartorioId)

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

    // Verificar se o cartório tem permissões específicas definidas
    const { data: temPermissoes } = await supabaseClient
      .from('cartorio_acesso_conteudo')
      .select('id')
      .eq('cartorio_id', cartorioId)
      .eq('ativo', true)
      .limit(1)

    let sistemas = []

    if (!temPermissoes || temPermissoes.length === 0) {
      // Se não há permissões específicas, retorna todos os sistemas
      console.log('🎯 [get-sistemas-cartorio] No specific permissions, returning all sistemas')
      
      const { data: todosSistemas, error: sistemasError } = await supabaseClient
        .from('sistemas')
        .select('*')
        .order('ordem')

      if (sistemasError) {
        throw sistemasError
      }

      sistemas = todosSistemas || []
    } else {
      // Retorna apenas os sistemas que o cartório tem acesso
      console.log('🎯 [get-sistemas-cartorio] Filtering by permissions')
      
      const { data: sistemasPermitidos, error: sistemasError } = await supabaseClient
        .from('sistemas')
        .select(`
          *
        `)
        .in('id', 
          supabaseClient
            .from('cartorio_acesso_conteudo')
            .select('sistema_id')
            .eq('cartorio_id', cartorioId)
            .eq('ativo', true)
            .not('sistema_id', 'is', null)
        )
        .order('ordem')

      if (sistemasError) {
        throw sistemasError
      }

      sistemas = sistemasPermitidos || []
    }

    console.log(`✅ [get-sistemas-cartorio] Returning ${sistemas.length} sistemas`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: sistemas 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [get-sistemas-cartorio] Unexpected error:', error)
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
