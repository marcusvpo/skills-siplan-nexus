import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Trata requisições OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 [LOGIN] Iniciando processo de autenticação...');

    // Analisa o corpo da requisição
    const body = await req.text();
    console.log('🔍 [DEBUG] Body raw:', body);

    const { username, login_token } = JSON.parse(body);
    console.log('🔍 [DEBUG] Data parsed:', { username, login_token });
    console.log('🔍 [DEBUG] username:', JSON.stringify(username));
    console.log('🔍 [DEBUG] login_token:', JSON.stringify(login_token));
    console.log('🔍 [DEBUG] username exists:', !!username);
    console.log('🔍 [DEBUG] login_token exists:', !!login_token);

    // Validação inicial dos parâmetros
    if (!username || !login_token) {
      console.log('❌ [LOGIN] Username ou login_token não fornecidos');
      console.log('❌ [DEBUG] username:', JSON.stringify(username), 'login_token:', JSON.stringify(login_token));
      return new Response(JSON.stringify({
        success: false,
        error: 'Username e login_token são obrigatórios'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('�� [LOGIN] Tentativa de login para username:', username);
    console.log('🔍 [LOGIN] Token recebido (presença):', login_token ? 'sim' : 'não');

    // Inicializa o cliente Supabase com a Service Role Key
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

    // Busca e valida o token de acesso customizado na tabela 'acessos_cartorio'
    const { data: tokenData, error: tokenError } = await supabase
      .from('acessos_cartorio')
      .select('*, cartorios!inner(*)') // Faz join com cartorios para pegar dados
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

    // Busca o usuário do cartório na tabela 'cartorio_usuarios'
    console.log('🔍 [LOGIN] Buscando usuário do cartório...');
    const { data: userData, error: userError } = await supabase
      .from('cartorio_usuarios')
      .select('*')
      .eq('username', username)
      .eq('cartorio_id', tokenData.cartorio_id) // Garante que o usuário pertence ao cartório do token
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
    // Corrige o erro "getUserByEmail is not a function" e melhora o fluxo de criação/obtenção de usuário.

    const email = userData.email || `${username}@cartorio.local`; // Garante que temos um email para o Supabase Auth

    try {
      console.log('🔍 [LOGIN] Tentando criar ou obter usuário no Supabase Auth...');
      
      // Tenta criar o usuário. Se já existir, o Supabase retornará um erro 409 (Conflict).
      const { data: newUser, error: createSupabaseAuthUserError } = await supabase.auth.admin.createUser({
        email: email,
        // IMPORTANTE: A senha aqui precisa ser uma senha válida para o Supabase Auth.
        // Se 'login_token' NÃO FOR uma senha, isso é uma vulnerabilidade de segurança.
        // O ideal é que a senha REAL do usuário venha do frontend ou seja gerada de forma segura.
        // Para fins de teste e funcionalidade, estamos usando login_token como password temporária aqui.
        password: login_token, 
        email_confirm: true, // Ou 'false' se não precisar de confirmação de email
        user_metadata: {
          username: userData.username,
          cartorio_id: userData.cartorio_id,
          db_user_id: userData.id, // Referência ao ID do usuário na sua tabela 'cartorio_usuarios'
          tipo: 'cartorio'
        }
      });

      if (createSupabaseAuthUserError) {
        // Se o erro for um conflito (usuário já existe), não é um problema.
        // A flag 'authUserExists' indica que podemos prosseguir com a geração de tokens.
        if (createSupabaseAuthUserError.status === 409 || createSupabaseAuthUserError.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
          console.log('ℹ️ [LOGIN] Usuário já existe no Supabase Auth com o email fornecido. Prosseguindo.');
          // Não precisamos do objeto do usuário aqui para generateLink, apenas do email.
        } else {
          // Qualquer outro erro na criação é um problema real.
          console.error('❌ [LOGIN] Erro inesperado ao criar usuário no Supabase Auth:', createSupabaseAuthUserError);
          throw createSupabaseAuthUserError; // Lança o erro para ser capturado pelo catch externo
        }
      } else {
        // Usuário foi criado com sucesso. O 'auth_user_id' pode ser o ID do novo usuário no Supabase Auth.
        console.log('✅ [LOGIN] Novo usuário criado no Supabase Auth:', newUser.user?.id);
        // Opcional: Atualizar o campo auth_user_id na sua tabela 'cartorio_usuarios'
        await supabase.from('cartorio_usuarios').update({ auth_user_id: newUser.user?.id }).eq('id', userData.id);
      }

      // Gerar tokens de sessão usando generateLink. Este método funciona para usuários existentes ou recém-criados.
      // Ele retornará o action_link com os tokens na URL ou nas propriedades.
      console.log('🔑 [LOGIN] Gerando tokens de sessão para o usuário Supabase Auth (email):', email);

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink', // Tipo de link que pode retornar tokens diretamente
        email: email,
        options: {
          redirectTo: `${supabaseUrl}/auth/v1/callback` // URL de callback para onde os tokens serão redirecionados
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

      // Tenta extrair tokens das propriedades do linkData, que é o ideal.
      if (linkData.properties?.access_token && linkData.properties?.refresh_token) {
        access_token = linkData.properties.access_token;
        refresh_token = linkData.properties.refresh_token;
        console.log('✅ [LOGIN] Tokens extraídos das propriedades do linkData.');
      } else if (linkData.action_link) {
        // Se não estiver nas propriedades, extrai da URL do action_link (comum para magic links).
        const url = new URL(linkData.action_link);
        access_token = url.searchParams.get('access_token');
        refresh_token = url.searchParams.get('refresh_token');
        console.log('✅ [LOGIN] Tokens extraídos da URL do action_link.');
      }

      // Verifica se os tokens foram extraídos com sucesso
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

      // Prepara a resposta de sucesso para o frontend
      const response = {
        success: true,
        user: {
          id: userData.id, // ID do usuário da sua tabela 'cartorio_usuarios'
          username: userData.username,
          cartorio_id: userData.cartorio_id,
          email: userData.email,
          auth_user_id: userData.auth_user_id || newUser?.user?.id // Inclui o auth_user_id, se disponível
        },
        cartorio: tokenData.cartorios, // Inclui os dados do cartório do token validado
        access_token,
        refresh_token,
        // expires_at: linkData.properties?.expires_at // Pode ser adicionado se necessário
      };

      console.log('🎉 [LOGIN] Login realizado com sucesso para:', username);
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