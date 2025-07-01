
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

    const { cartorioId, permissoes } = await req.json()

    console.log('🔐 [update-cartorio-permissions] Update request for:', cartorioId)
    console.log('🔐 [update-cartorio-permissions] New permissions:', permissoes)

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

    // Deletar todas as permissões existentes do cartório
    const { error: deleteError } = await supabaseClient
      .from('cartorio_acesso_conteudo')
      .delete()
      .eq('cartorio_id', cartorioId)

    if (deleteError) {
      console.error('❌ [update-cartorio-permissions] Error deleting old permissions:', deleteError)
      throw deleteError
    }

    // Inserir as novas permissões
    if (permissoes && permissoes.length > 0) {
      const novasPermissoes = permissoes.map((p: any) => ({
        cartorio_id: cartorioId,
        sistema_id: p.sistema_id || null,
        produto_id: p.produto_id || null,
        ativo: true
      }))

      const { error: insertError } = await supabaseClient
        .from('cartorio_acesso_conteudo')
        .insert(novasPermissoes)

      if (insertError) {
        console.error('❌ [update-cartorio-permissions] Error inserting new permissions:', insertError)
        throw insertError
      }
    }

    console.log('✅ [update-cartorio-permissions] Permissions updated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Permissões atualizadas com sucesso!' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [update-cartorio-permissions] Unexpected error:', error)
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
