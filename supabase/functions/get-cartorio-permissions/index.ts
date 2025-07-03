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

    console.log('🔐 [get-cartorio-permissions] Permissions request for:', cartorioId)

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

    // Buscar todas as permissões do cartório
    const { data: permissoes, error: permissoesError } = await supabaseClient
      .from('cartorio_acesso_conteudo')
      .select(`
        *,
        sistemas:sistema_id(id, nome, ordem),
        produtos:produto_id(id, nome, ordem, sistema_id)
      `)
      .eq('cartorio_id', cartorioId)
      .eq('ativo', true)

    if (permissoesError) {
      console.error('❌ [get-cartorio-permissions] Error fetching permissions:', permissoesError)
      throw permissoesError
    }

    console.log('🔐 [get-cartorio-permissions] Raw permissions found:', permissoes?.length || 0)

    // Buscar todos os sistemas e produtos disponíveis
    const { data: todosOsSistemas, error: sistemasError } = await supabaseClient
      .from('sistemas')
      .select(`
        *,
        produtos:produtos(*)
      `)
      .order('ordem')

    if (sistemasError) {
      console.error('❌ [get-cartorio-permissions] Error fetching sistemas:', sistemasError)
      throw sistemasError
    }

    console.log('🔐 [get-cartorio-permissions] Total sistemas found:', todosOsSistemas?.length || 0)

    // Log detalhado das permissões para debug
    if (permissoes) {
      permissoes.forEach(p => {
        console.log('🔐 Permission:', {
          id: p.id,
          cartorio_id: p.cartorio_id,
          sistema_id: p.sistema_id,
          produto_id: p.produto_id,
          ativo: p.ativo
        })
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          permissoes: permissoes || [],
          todosOsSistemas: todosOsSistemas || []
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [get-cartorio-permissions] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Erro interno do servidor: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
