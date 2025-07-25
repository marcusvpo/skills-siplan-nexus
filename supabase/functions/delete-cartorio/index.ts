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

    // Verificar autenticação: Admin via Supabase Auth OU JWT customizado
    let isAdmin = false;
    
    try {
      // Primeiro tentar Supabase Auth
      const supabaseClient = createClient(
        supabaseUrl,
        customServiceKey || legacyServiceKey || '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          global: {
            headers: {
              Authorization: authHeader
            }
          }
        }
      );

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      
      if (!authError && user) {
        // Verificar se é admin na tabela admins
        const { data: adminData, error: adminError } = await supabaseClient
          .from('admins')
          .select('email')
          .eq('email', user.email)
          .single();

        if (!adminError && adminData) {
          console.log('✅ [AUTH] Admin verified via Supabase Auth:', user.email);
          isAdmin = true;
        }
      }
      
      // Se Supabase Auth falhou, tentar JWT customizado
      if (!isAdmin && jwtSecret) {
        try {
          const secret = new TextEncoder().encode(jwtSecret);
          const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
          console.log('✅ [JWT] Custom JWT verified, checking admin status');
          
          isAdmin = payload.role === 'admin' || payload.is_admin === true;
          
          if (isAdmin) {
            console.log('✅ [AUTH] Admin verified via custom JWT');
          }
        } catch (jwtError) {
          console.log('🔄 [JWT] Custom JWT verification failed:', jwtError.message);
        }
      }
      
      if (!isAdmin) {
        console.error('❌ [AUTH] User is not admin');
        return new Response(JSON.stringify({ error: 'Acesso negado: apenas administradores' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
    } catch (error) {
      console.error('❌ [AUTH] Authentication verification failed:', error.message);
      return new Response(JSON.stringify({ error: 'Erro na verificação de autenticação' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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