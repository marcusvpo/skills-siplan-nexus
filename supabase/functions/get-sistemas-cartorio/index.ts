
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

    // Pegar cartorioId do body da requisição
    const { cartorioId } = await req.json()

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
    const { data: temPermissoes, error: permissoesError } = await supabaseClient
      .from('cartorio_acesso_conteudo')
      .select('id')
      .eq('cartorio_id', cartorioId)
      .eq('ativo', true)
      .limit(1)

    if (permissoesError) {
      console.error('❌ [get-sistemas-cartorio] Error checking permissions:', permissoesError)
      throw permissoesError
    }

    let sistemas = []

    if (!temPermissoes || temPermissoes.length === 0) {
      // Se não há permissões específicas, retorna todos os sistemas
      console.log('🎯 [get-sistemas-cartorio] No specific permissions, returning all sistemas')
      
      const { data: todosSistemas, error: sistemasError } = await supabaseClient
        .from('sistemas')
        .select('*')
        .order('ordem')

      if (sistemasError) {
        console.error('❌ [get-sistemas-cartorio] Error fetching all sistemas:', sistemasError)
        throw sistemasError
      }

      sistemas = todosSistemas || []
    } else {
      // Retorna apenas os sistemas que o cartório tem acesso
      console.log('🎯 [get-sistemas-cartorio] Filtering by permissions')
      
      // Buscar sistemas com acesso direto
      const { data: sistemasComAcessoDireto, error: sistemasError } = await supabaseClient
        .from('cartorio_acesso_conteudo')
        .select(`
          sistema_id,
          sistemas:sistema_id(*)
        `)
        .eq('cartorio_id', cartorioId)
        .eq('ativo', true)
        .not('sistema_id', 'is', null)

      if (sistemasError) {
        console.error('❌ [get-sistemas-cartorio] Error fetching sistemas with direct access:', sistemasError)
        throw sistemasError
      }

      // Buscar sistemas que têm produtos com acesso específico
      const { data: sistemasComProdutos, error: produtosError } = await supabaseClient
        .from('cartorio_acesso_conteudo')
        .select(`
          produto_id,
          produtos:produto_id(
            sistema_id,
            sistemas:sistema_id(*)
          )
        `)
        .eq('cartorio_id', cartorioId)
        .eq('ativo', true)
        .not('produto_id', 'is', null)

      if (produtosError) {
        console.error('❌ [get-sistemas-cartorio] Error fetching sistemas from produtos:', produtosError)
        throw produtosError
      }

      // Combinar sistemas únicos
      const sistemasMap = new Map()
      
      // Adicionar sistemas com acesso direto
      sistemasComAcessoDireto?.forEach(item => {
        if (item.sistemas) {
          sistemasMap.set(item.sistemas.id, item.sistemas)
        }
      })

      // Adicionar sistemas que têm produtos com acesso
      sistemasComProdutos?.forEach(item => {
        if (item.produtos?.sistemas) {
          sistemasMap.set(item.produtos.sistemas.id, item.produtos.sistemas)
        }
      })

      sistemas = Array.from(sistemasMap.values()).sort((a, b) => a.ordem - b.ordem)
    }

    console.log(`✅ [get-sistemas-cartorio] Returning ${sistemas.length} sistemas for cartorio ${cartorioId}`)

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
    console.error('❌ [get-sistemas-cartorio] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
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
