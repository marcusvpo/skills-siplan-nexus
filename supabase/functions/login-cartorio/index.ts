import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 [LOGIN] Iniciando processo de autenticação...');
    
    // Parse request body
    const { username, login_token } = await req.json();
    console.log('🔍 [LOGIN] Tentativa de login para username:', username);
    console.log('🔍 [LOGIN] Token recebido (presença):', login_token ? 'sim' : 'não');

    if (!username || !login_token) {
      console.log('❌ [LOGIN] Username ou login_token não fornecidos');
      return new Response(JSON.stringify({
        success: false,
        error: 'Username e login_token são obrigatórios'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [LOGIN] Variáveis de ambiente não configuradas');
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuração do servidor incorreta'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Buscar token de acesso válido
    console.log('🔍 [LOGIN] Verificando token de acesso na tabela acessos_cartorio...');
    const { data: tokenData, error: tokenError } = await supabase
      .from('acessos_cartorio')
      .select('*, cartorios!inner(*)')
      .eq('login_token', login_token)
      .eq('ativo', true)
      .gte('data_expiracao', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      console.log('❌ [LOGIN] Token de acesso inválido ou expirado:', tokenError?.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de acesso inválido ou expirado'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ [LOGIN] Token de acesso validado com sucesso na tabela acessos_cartorio.');

    // Buscar usuário do cartório
    console.log('🔍 [LOGIN] Buscando usuário do cartório...');
    const { data: userData, error: userError } = await supabase
      .from('cartorio_usuarios')
      .select('*')
      .eq('username', username)
      .eq('cartorio_id', tokenData.cartorio_id)
      .eq('is_active', true)
      .single();

    if (userError || !userData) {
      console.log('❌ [LOGIN] Usuário não encontrado ou inativo:', userError?.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuário não encontrado ou inativo'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ [LOGIN] Usuário e cartório ativos encontrados:', userData.username);

    // Verificar/criar usuário no Supabase Auth
    let authUser;
    const email = userData.email || `${username}@cartorio.local`;

    try {
      console.log('🔍 [LOGIN] Verificando usuário no Supabase Auth...');
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
      authUser = existingUser.user;
      console.log('✅ [LOGIN] Usuário existente no Supabase Auth:', authUser?.id);
    } catch (error) {
      console.log('ℹ️ [LOGIN] Criando usuário no Supabase Auth...');
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: login_token, // Usar o token como password temporária
        user_metadata: {
          username: userData.username,
          cartorio_id: userData.cartorio_id,
          tipo: 'cartorio'
        }
      });

      if (createError) {
        console.error('❌ [LOGIN] Erro ao criar usuário no Supabase Auth:', createError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Erro ao criar sessão de autenticação'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      authUser = newUser.user;
      console.log('✅ [LOGIN] Usuário criado no Supabase Auth:', authUser?.id);
    }

    if (!authUser) {
      console.error('❌ [LOGIN] Falha ao obter/criar usuário no Supabase Auth');
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro na autenticação'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Gerar tokens usando generateLink
    console.log('🔑 [LOGIN] Gerando tokens de sessão para o usuário Supabase Auth:', authUser.id);
    
    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: authUser.email,
        options: {
          redirectTo: `${supabaseUrl}/auth/v1/callback`
        }
      });

      if (linkError) {
        console.error('❌ [LOGIN] Erro ao gerar link:', linkError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Erro interno na geração de tokens',
          code: 'TOKEN_GENERATION_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Extrair tokens do link
      let access_token, refresh_token, expires_at;

      if (linkData.properties?.access_token && linkData.properties?.refresh_token) {
        // Tokens estão nas propriedades
        access_token = linkData.properties.access_token;
        refresh_token = linkData.properties.refresh_token;
        expires_at = linkData.properties.expires_at;
        console.log('✅ [LOGIN] Tokens extraídos das propriedades do link');
      } else if (linkData.action_link) {
        // Extrair tokens da URL
        const url = new URL(linkData.action_link);
        access_token = url.searchParams.get('access_token');
        refresh_token = url.searchParams.get('refresh_token');
        expires_at = url.searchParams.get('expires_at');
        console.log('✅ [LOGIN] Tokens extraídos da URL do link');
      }

      if (!access_token || !refresh_token) {
        console.error('❌ [LOGIN] Tokens não encontrados no link gerado');
        return new Response(JSON.stringify({
          success: false,
          error: 'Tokens de autenticação não gerados',
          code: 'TOKEN_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Preparar resposta de sucesso
      const response = {
        success: true,
        user: {
          id: userData.id,
          username: userData.username,
          cartorio_id: userData.cartorio_id,
          auth_user_id: authUser.id,
          email: userData.email
        },
        cartorio: tokenData.cartorios,
        access_token,
        refresh_token,
        expires_at
      };

      console.log('🎉 [LOGIN] Login realizado com sucesso para:', username);
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('❌ [LOGIN] Erro crítico na geração de tokens:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro interno na geração de tokens',
        code: 'TOKEN_GENERATION_ERROR'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('💥 [LOGIN] Erro não tratado:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});