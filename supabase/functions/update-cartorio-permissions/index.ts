// v2 - migrado para CUSTOM_SERVICE_KEY + jwtVerify
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verificar se é admin via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [AUTH] Missing or invalid authorization header');
      return new Response(JSON.stringify({ error: 'Authorization header obrigatório' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 [JWT] Processing admin JWT token');

    if (!jwtSecret) {
      console.error('❌ [JWT] JWT_SECRET not configured');
      return new Response(JSON.stringify({ error: 'JWT configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar JWT (para admins)
    let isAdmin = false;
    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
      console.log('🔐 [JWT] Token verified, checking admin status');
      
      // Para esta função, assumimos que apenas admins fazem esta operação
      isAdmin = payload.role === 'admin' || payload.is_admin === true;
      
      if (!isAdmin) {
        console.error('❌ [AUTH] User is not admin');
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

    console.log('🔐 [update-cartorio-permissions] Function started')
    
    const supabaseClient = createClient(
      supabaseUrl,
      customServiceKey || legacyServiceKey || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const requestBody = await req.json()
    console.log('🔐 [PERMISSIONS] Request body:', JSON.stringify(requestBody, null, 2))

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

    console.log('🔐 [PERMISSIONS] Processing for cartorio:', cartorioId)

    // Deletar todas as permissões existentes do cartório
    console.log('🔐 [PERMISSIONS] Deleting existing permissions...')
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

    console.log('✅ [PERMISSIONS] Old permissions deleted')

    // Inserir as novas permissões se houver alguma
    if (permissoes && Array.isArray(permissoes) && permissoes.length > 0) {
      console.log('🔐 [PERMISSIONS] Preparing new permissions...')
      
      const novasPermissoes = permissoes.map((p: any) => {
        console.log('🔐 [PERMISSIONS] Processing permission:', p)
        
        // CORREÇÃO CRÍTICA: Garantir que IDs sejam UUIDs válidos ou null
        let sistema_id = null;
        let produto_id = null;
        
        if (p.sistema_id && typeof p.sistema_id === 'string') {
          // Verificar se é um UUID válido (36 caracteres com hifens)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(p.sistema_id)) {
            sistema_id = p.sistema_id;
          } else {
            console.warn('🔐 [PERMISSIONS] Invalid sistema_id format:', p.sistema_id);
          }
        }
        
        if (p.produto_id && typeof p.produto_id === 'string') {
          // Verificar se é um UUID válido (36 caracteres com hifens)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(p.produto_id)) {
            produto_id = p.produto_id;
          } else {
            console.warn('🔐 [PERMISSIONS] Invalid produto_id format:', p.produto_id);
          }
        }

        const permission = {
          cartorio_id: cartorioId,
          sistema_id: sistema_id,
          produto_id: produto_id,
          ativo: true,
          nivel_acesso: 'completo'
        }
        
        console.log('🔐 [PERMISSIONS] Formatted permission:', permission)
        return permission
      }).filter(p => p.sistema_id || p.produto_id) // Filtrar permissões que não tenham nem sistema nem produto válido

      console.log('🔐 [PERMISSIONS] Final permissions to insert:', JSON.stringify(novasPermissoes, null, 2))

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

        console.log('✅ [PERMISSIONS] New permissions inserted:', insertedData?.length || 0)
      } else {
        console.log('⚠️ [PERMISSIONS] No valid permissions to insert')
      }
    } else {
      console.log('🔐 [PERMISSIONS] No permissions to insert (full access)')
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