import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    console.log('🚀 [LOGIN] Iniciando processo de login...');
    // Parse request body
    const { username, password } = await req.json();
    console.log('🔍 [LOGIN] Username:', username);
    console.log('🔍 [LOGIN] Password é undefined?', password === undefined);
    if (!username || !password) {
      console.log('❌ [LOGIN] Username ou password não fornecidos');
      return new Response(JSON.stringify({
        error: 'Username e password são obrigatórios'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('🔗 [LOGIN] Cliente Supabase inicializado');
    // Verificar se o usuário existe na tabela usuarios
    console.log('🔍 [LOGIN] Verificando usuário na tabela usuarios...');
    const { data: userData, error: userError } = await supabase.from('usuarios').select('*').eq('username', username).eq('password', password).single();
    if (userError) {
      console.log('❌ [LOGIN] Erro ao buscar usuário:', userError);
      return new Response(JSON.stringify({
        error: 'Credenciais inválidas'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!userData) {
      console.log('❌ [LOGIN] Usuário não encontrado ou senha incorreta');
      return new Response(JSON.stringify({
        error: 'Credenciais inválidas'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✅ [LOGIN] Usuário encontrado:', userData.id);
    // Verificar se o usuário já existe no Supabase Auth
    let authUser;
    const email = `${username}@cartorio.local`;
    try {
      console.log('🔍 [LOGIN] Verificando se usuário existe no Supabase Auth...');
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
      authUser = existingUser.user;
      console.log('✅ [LOGIN] Usuário já existe no Supabase Auth:', authUser?.id);
    } catch (error) {
      console.log('ℹ️ [LOGIN] Usuário não existe no Supabase Auth, criando...');
      // Criar usuário no Supabase Auth
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        user_metadata: {
          username: userData.username,
          cartorio_id: userData.cartorio_id,
          is_admin: userData.is_admin
        }
      });
      if (createError) {
        console.error('❌ [LOGIN] Erro ao criar usuário no Supabase Auth:', createError);
        return new Response(JSON.stringify({
          error: 'Erro ao criar sessão de autenticação'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      authUser = newUser.user;
      console.log('✅ [LOGIN] Usuário criado no Supabase Auth:', authUser?.id);
    }
    if (!authUser) {
      console.error('❌ [LOGIN] Falha ao obter/criar usuário no Supabase Auth');
      return new Response(JSON.stringify({
        error: 'Erro na autenticação'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Gerar tokens de acesso usando o Supabase Auth
    console.log('🔑 [LOGIN] Gerando tokens de acesso...');
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateAccessToken(authUser.id);
    if (sessionError) {
      console.error('❌ [LOGIN] Erro ao gerar tokens:', sessionError);
      return new Response(JSON.stringify({
        error: 'Erro ao gerar tokens de acesso'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✅ [LOGIN] Tokens gerados com sucesso');
    // Buscar dados do cartório
    let cartorioData = null;
    if (userData.cartorio_id) {
      console.log('🏢 [LOGIN] Buscando dados do cartório...');
      const { data: cartorio, error: cartorioError } = await supabase.from('cartorios').select('*').eq('id', userData.cartorio_id).single();
      if (!cartorioError && cartorio) {
        cartorioData = cartorio;
        console.log('✅ [LOGIN] Dados do cartório encontrados');
      }
    }
    // Preparar resposta
    const response = {
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        cartorio_id: userData.cartorio_id,
        is_admin: userData.is_admin,
        auth_user_id: authUser.id
      },
      cartorio: cartorioData,
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
      expires_at: sessionData.expires_at
    };
    console.log('🎉 [LOGIN] Login realizado com sucesso para:', username);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('💥 [LOGIN] Erro não tratado:', error);
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
