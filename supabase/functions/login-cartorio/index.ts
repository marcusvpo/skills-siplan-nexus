import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('�� [LOGIN] Iniciando processo de autenticação...');

    const body = await req.text();
    console.log('🔍 [DEBUG] Body raw:', body);

    const { username, login_token } = JSON.parse(body);
    console.log('�� [DEBUG] Data parsed:', { username, login_token });
    console.log('🔍 [DEBUG] username:', JSON.stringify(username));
    console.log('�� [DEBUG] login_token:', JSON.stringify(login_token));
    console.log('🔍 [DEBUG] username exists:', !!username);
    console.log('🔍 [DEBUG] login_token exists:', !!login_token);

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

    console.log('🔍 [LOGIN] Tentativa de login para username:', username);
    console.log('🔍 [LOGIN] Token recebido (presença):', login_token ? 'sim' : 'não');

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

    console.log('�� [LOGIN] Buscando usuário do cartório...');
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

    // --- SEÇÃO DE AUTENTICAÇÃO COM SUPABASE AUTH ---
    const email = userData.email || `${username}@cartorio.local`;

    try {
      console.log('🔍 [LOGIN] Tentando criar usuário no Supabase Auth...');
      
      const { data: newUser, error: createSupabaseAuthUserError } = await supabase.auth.admin.createUser({
        email: email,
        password: login_token, // Lembre-se da nota de segurança sobre usar login_token como password
        email_confirm: true,
        user_metadata: {
          username: userData.username,
          cartorio_id: userData.cartorio_id,
          db_user_id: userData.id,
          tipo: 'cartorio'
        }
      });

      if (createSupabaseAuthUserError) {
        // CORREÇÃO: Verifique o 'code' específico para 'email_exists' (ou status 422)
        if (createSupabaseAuthUserError.code === 'email_exists' || createSupabaseAuthUserError.status === 422) {
          console.log('ℹ️ [LOGIN] Usuário já existe no Supabase Auth com o email fornecido. Prosseguindo para gerar tokens.');
          // Não lançamos erro, apenas prosseguimos para gerar o link de autenticação para este email.
        } else {
          // Para qualquer outro erro de criação de usuário, lançamos o erro.
          console.error('❌ [LOGIN] Erro inesperado ao criar usuário no Supabase Auth:', createSupabaseAuthUserError);
          throw createSupabaseAuthUserError;
        }
      } else {
        console.log('✅ [LOGIN] Novo usuário criado no Supabase Auth:', newUser.user?.id);
        // Opcional: Atualizar o campo auth_user_id na sua tabela 'cartorio_usuarios'
        // Isso é importante para que o Supabase Auth saiba o ID do usuário no seu banco de dados
        await supabase.from('cartorio_usuarios').update({ auth_user_id: newUser.user?.id }).eq('id', userData.id);
      }

      // Gerar tokens de sessão usando generateLink para o email, que funciona para usuários existentes ou recém-criados.
      console.log('🔑 [LOGIN] Gerando tokens de sessão para o usuário Supabase Auth (email):', email);

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: `${supabaseUrl}/auth/v1/callback`
        }
      });

      if (linkError) {
        console.error('❌ [LOGIN] Erro ao gerar link para tokens:', linkError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Erro interno na geração de tokens',
          code: 'TOKEN_GENERATION_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let access_token, refresh_token;

      if (linkData.properties?.access_token && linkData.properties?.refresh_token) {
        access_token = linkData.properties.access_token;
        refresh_token = linkData.properties.refresh_token;
        console.log('✅ [LOGIN] Tokens extraídos das propriedades do linkData.');
      } else if (linkData.action_link) {
        const url = new URL(linkData.action_link);
        access_token = url.searchParams.get('access_token');
        refresh_token = url.searchParams.get('refresh_token');
        console.log('✅ [LOGIN] Tokens extraídos da URL do action_link.');
      }

      if (!access_token || !refresh_token) {
        console.error('❌ [LOGIN] AccessToken ou RefreshToken não encontrados após gerar link.');
        return new Response(JSON.stringify({
          success: false,
          error: 'Tokens de autenticação não gerados ou inválidos',
          code: 'TOKEN_MISSING'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const response = {
        success: true,
        user: {
          id: userData.id,
          username: userData.username,
          cartorio_id: userData.cartorio_id,
          email: userData.email,
          auth_user_id: userData.auth_user_id // Se o usuário já existia, manterá o ID, se foi criado, terá o novo ID.
        },
        cartorio: tokenData.cartorios,
        access_token,
        refresh_token,
      };

      console.log('�� [LOGIN] Login realizado com sucesso para:', username);
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('❌ [LOGIN] Erro crítico no fluxo de autenticação Supabase Auth:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro interno do servidor durante a autenticação',
        details: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('💥 [LOGIN] Erro não tratado na Edge Function:', error);
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