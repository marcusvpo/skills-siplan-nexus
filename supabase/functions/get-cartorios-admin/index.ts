import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey = Deno.env.get('CUSTOM_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

console.log('🔧 [Init] Service key configured:', serviceKey ? 'Yes' : 'No');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verificar se é admin via Supabase Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [AUTH] Missing or invalid authorization header');
      return new Response(JSON.stringify({ error: 'Authorization header obrigatório' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 [AUTH] Verifying Supabase token');

    // Criar cliente Supabase com service key para verificação
    const supabaseClient = createClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar token do usuário
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error('❌ [AUTH] Invalid Supabase token:', userError?.message);
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ [AUTH] Token verified for user:', userData.user.email);

    // Verificar se o usuário é admin
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('admins')
      .select('*')
      .eq('email', userData.user.email)
      .single();

    if (adminError || !adminCheck) {
      console.error('❌ [AUTH] User is not admin:', userData.user.email);
      return new Response(JSON.stringify({ error: 'Usuário não é administrador' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ [AUTH] Admin verified:', userData.user.email)

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