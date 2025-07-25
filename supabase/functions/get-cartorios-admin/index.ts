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

    // Verificar se é admin - duas formas: JWT customizado ou Supabase Auth
    let isAdmin = false;
    let adminData = null;
    
    try {
      // Tentativa 1: JWT customizado (HS256)
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
      console.log('🔐 [JWT] Custom token verified, checking admin status');
      isAdmin = payload.role === 'admin' || payload.is_admin === true;
      
      if (isAdmin) {
        console.log('✅ [AUTH] Admin verified via custom JWT');
      }
    } catch (customJwtError) {
      console.log('🔄 [JWT] Custom JWT verification failed, trying Supabase Auth:', customJwtError.message);
      
      // Tentativa 2: Token do Supabase Auth
      try {
        const supabaseClient = createClient(
          supabaseUrl,
          customServiceKey || legacyServiceKey || '',
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );

        // Usar o token para fazer uma requisição autenticada ao Supabase
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        
        if (userError || !userData.user) {
          throw new Error('Token Supabase inválido');
        }

        // Verificar se o usuário é admin
        const { data: adminCheck, error: adminError } = await supabaseClient
          .from('admins')
          .select('*')
          .eq('email', userData.user.email)
          .single();

        if (adminError || !adminCheck) {
          throw new Error('Usuário não é administrador');
        }

        isAdmin = true;
        adminData = adminCheck;
        console.log('✅ [AUTH] Admin verified via Supabase Auth:', userData.user.email);
        
      } catch (supabaseAuthError) {
        console.error('❌ [AUTH] Both JWT verifications failed:', supabaseAuthError.message);
        return new Response(JSON.stringify({ error: 'Token inválido ou usuário não é admin' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (!isAdmin) {
      console.error('❌ [AUTH] User is not admin');
      return new Response(JSON.stringify({ error: 'Acesso negado: apenas administradores' }), {
        status: 403,
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

    console.log('🏢 [get-cartorios-admin] Admin cartorios list requested')

    // Buscar todos os cartórios com dados completos
    const { data: cartorios, error: cartoriosError } = await supabaseClient
      .from('cartorios')
      .select(`
        *,
        acessos_cartorio:acessos_cartorio(
          id,
          login_token,
          data_expiracao,
          ativo,
          email_contato
        ),
        cartorio_usuarios:cartorio_usuarios(
          id,
          username,
          email,
          is_active
        )
      `)
      .order('nome')

    if (cartoriosError) {
      console.error('❌ [get-cartorios-admin] Error fetching cartorios:', cartoriosError)
      throw cartoriosError
    }

    console.log(`✅ [PERMISSIONS] Found ${cartorios?.length || 0} cartorios`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: cartorios || [],
        count: cartorios?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [get-cartorios-admin] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})