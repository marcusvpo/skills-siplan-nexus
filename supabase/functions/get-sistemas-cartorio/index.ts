
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
    console.log('🎯 [get-sistemas-cartorio] Function started')
    
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
    console.log('🎯 [get-sistemas-cartorio] Request for cartorio:', cartorioId)

    if (!cartorioId) {
      console.error('❌ [get-sistemas-cartorio] Missing cartorioId')
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

    // Buscar todos os sistemas com produtos e videoaulas
    console.log('🎯 [get-sistemas-cartorio] Fetching all sistemas with full hierarchy...')
    const { data: todosSistemas, error: sistemasError } = await supabaseClient
      .from('sistemas')
      .select(`
        *,
        produtos (
          *,
          video_aulas (*)
        )
      `)
      .order('ordem')

    if (sistemasError) {
      console.error('❌ [get-sistemas-cartorio] Error fetching sistemas:', sistemasError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao buscar sistemas: ${sistemasError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ [get-sistemas-cartorio] Found sistemas:', todosSistemas?.length || 0)

    // Verificar se o cartório tem permissões específicas definidas
    const { data: permissoes, error: permissoesError } = await supabaseClient
      .from('cartorio_acesso_conteudo')
      .select('*')
      .eq('cartorio_id', cartorioId)
      .eq('ativo', true)

    if (permissoesError) {
      console.error('❌ [get-sistemas-cartorio] Error checking permissions:', permissoesError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao verificar permissões: ${permissoesError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🎯 [get-sistemas-cartorio] Found permissions:', permissoes?.length || 0)

    let sistemasFiltrados = []

    if (!permissoes || permissoes.length === 0) {
      // Se não há permissões específicas, retorna todos os sistemas
      console.log('🎯 [get-sistemas-cartorio] No specific permissions, returning all sistemas')
      sistemasFiltrados = todosSistemas || []
    } else {
      // Filtrar com base nas permissões
      console.log('🎯 [get-sistemas-cartorio] Filtering by permissions')
      
      const sistemasPermitidos = new Set()
      const produtosPermitidos = new Set()
      
      // Coletar IDs permitidos
      permissoes.forEach(p => {
        if (p.sistema_id && !p.produto_id) {
          // Acesso ao sistema completo
          sistemasPermitidos.add(p.sistema_id)
        } else if (p.produto_id) {
          // Acesso a produto específico
          produtosPermitidos.add(p.produto_id)
        }
      })
      
      // Filtrar sistemas
      sistemasFiltrados = (todosSistemas || []).filter(sistema => {
        // Se tem acesso ao sistema completo
        if (sistemasPermitidos.has(sistema.id)) {
          return true
        }
        
        // Se tem acesso a algum produto deste sistema
        if (sistema.produtos && sistema.produtos.some(produto => produtosPermitidos.has(produto.id))) {
          // Filtrar apenas os produtos permitidos
          sistema.produtos = sistema.produtos.filter(produto => produtosPermitidos.has(produto.id))
          return true
        }
        
        return false
      })
    }

    console.log('✅ [get-sistemas-cartorio] Returning sistemas:', sistemasFiltrados?.length || 0)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: sistemasFiltrados 
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
