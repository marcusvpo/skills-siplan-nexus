
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
    console.log('🔐 [update-cartorio-permissions] Function started')
    
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

    const requestBody = await req.json()
    console.log('🔐 [update-cartorio-permissions] Request body:', JSON.stringify(requestBody, null, 2))

    const { cartorioId, permissoes } = requestBody

    if (!cartorioId) {
      console.error('❌ [update-cartorio-permissions] Missing cartorioId')
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

    console.log('🔐 [update-cartorio-permissions] Processing for cartorio:', cartorioId)

    // Deletar todas as permissões existentes do cartório
    console.log('🔐 [update-cartorio-permissions] Deleting existing permissions...')
    const { error: deleteError } = await supabaseClient
      .from('cartorio_acesso_conteudo')
      .delete()
      .eq('cartorio_id', cartorioId)

    if (deleteError) {
      console.error('❌ [update-cartorio-permissions] Delete error:', deleteError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao deletar permissões antigas: ${deleteError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ [update-cartorio-permissions] Old permissions deleted')

    // Inserir as novas permissões se houver alguma
    if (permissoes && Array.isArray(permissoes) && permissoes.length > 0) {
      console.log('🔐 [update-cartorio-permissions] Preparing new permissions...')
      
      const novasPermissoes = permissoes.map((p: any) => {
        console.log('🔐 [update-cartorio-permissions] Processing permission:', p)
        
        // CORREÇÃO: Validar e formatar UUIDs corretamente
        let sistema_id = null;
        let produto_id = null;
        
        if (p.sistema_id) {
          // Validar se é um UUID válido ou completar se necessário
          if (p.sistema_id.length === 36) {
            sistema_id = p.sistema_id;
          } else {
            console.warn('🔐 [update-cartorio-permissions] Invalid sistema_id format:', p.sistema_id);
          }
        }
        
        if (p.produto_id) {
          // Validar se é um UUID válido ou completar se necessário
          if (p.produto_id.length === 36) {
            produto_id = p.produto_id;
          } else {
            console.warn('🔐 [update-cartorio-permissions] Invalid produto_id format:', p.produto_id);
          }
        }

        const permission = {
          cartorio_id: cartorioId,
          sistema_id: sistema_id,
          produto_id: produto_id,
          ativo: true,
          nivel_acesso: 'completo'
        }
        
        console.log('🔐 [update-cartorio-permissions] Formatted permission:', permission)
        return permission
      }).filter(p => p.sistema_id || p.produto_id) // Filtrar permissões inválidas

      console.log('🔐 [update-cartorio-permissions] Final permissions to insert:', JSON.stringify(novasPermissoes, null, 2))

      if (novasPermissoes.length > 0) {
        const { data: insertedData, error: insertError } = await supabaseClient
          .from('cartorio_acesso_conteudo')
          .upsert(novasPermissoes)
          .select()

        if (insertError) {
          console.error('❌ [update-cartorio-permissions] Insert error:', insertError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Erro ao inserir novas permissões: ${insertError.message}` 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        console.log('✅ [update-cartorio-permissions] New permissions inserted:', insertedData?.length || 0)
      } else {
        console.log('⚠️ [update-cartorio-permissions] No valid permissions to insert')
      }
    } else {
      console.log('🔐 [update-cartorio-permissions] No permissions to insert (full access)')
    }

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
    console.error('❌ [update-cartorio-permissions] Unexpected error:', {
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
