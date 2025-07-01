
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
    console.log('🔐 [update-cartorio-permissions] New permissions:', JSON.stringify(permissoes, null, 2))

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

    // Validar que cartorioId é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(cartorioId)) {
      console.error('❌ [update-cartorio-permissions] Invalid cartorioId format:', cartorioId)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Formato de cartorioId inválido' 
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

    console.log('✅ [update-cartorio-permissions] Old permissions deleted successfully')

    // Inserir as novas permissões se houver alguma
    if (permissoes && permissoes.length > 0) {
      const novasPermissoes = []
      
      for (let i = 0; i < permissoes.length; i++) {
        const p = permissoes[i]
        
        // Validar UUIDs se fornecidos
        if (p.sistema_id && !uuidRegex.test(p.sistema_id)) {
          console.error('❌ [update-cartorio-permissions] Invalid sistema_id format:', p.sistema_id)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Formato de sistema_id inválido: ${p.sistema_id}` 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        if (p.produto_id && !uuidRegex.test(p.produto_id)) {
          console.error('❌ [update-cartorio-permissions] Invalid produto_id format:', p.produto_id)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Formato de produto_id inválido: ${p.produto_id}` 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        const permissao = {
          cartorio_id: cartorioId,
          sistema_id: p.sistema_id || null,
          produto_id: p.produto_id || null,
          ativo: true
        }
        
        console.log(`🔐 [update-cartorio-permissions] Permission ${i + 1}:`, permissao)
        novasPermissoes.push(permissao)
      }

      const { data: insertedData, error: insertError } = await supabaseClient
        .from('cartorio_acesso_conteudo')
        .insert(novasPermissoes)
        .select()

      if (insertError) {
        console.error('❌ [update-cartorio-permissions] Error inserting new permissions:', insertError)
        throw insertError
      }

      console.log('✅ [update-cartorio-permissions] New permissions inserted:', insertedData?.length || 0)
    } else {
      console.log('🔐 [update-cartorio-permissions] No permissions to insert (full access)')
    }

    // Verificar se as permissões foram realmente salvas
    const { data: verification, error: verifyError } = await supabaseClient
      .from('cartorio_acesso_conteudo')
      .select('*')
      .eq('cartorio_id', cartorioId)
      .eq('ativo', true)

    if (verifyError) {
      console.error('❌ [update-cartorio-permissions] Error verifying save:', verifyError)
    } else {
      console.log('✅ [update-cartorio-permissions] Verification - saved permissions:', verification?.length || 0)
      verification?.forEach((perm, index) => {
        console.log(`✅ [update-cartorio-permissions] Saved permission ${index + 1}:`, {
          id: perm.id,
          cartorio_id: perm.cartorio_id,
          sistema_id: perm.sistema_id,
          produto_id: perm.produto_id,
          ativo: perm.ativo
        })
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Permissões atualizadas com sucesso!',
        savedCount: verification?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [update-cartorio-permissions] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code || 'UNKNOWN'
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
