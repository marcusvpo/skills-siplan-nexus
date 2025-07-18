import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0'; // <<< LINHA ATUALIZADA AQUI

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { username, login_token } = await req.json();
    console.log('🔍 [LOGIN] Tentativa de login para username:', username);
    console.log('🔍 [LOGIN] Token recebido (presença):', login_token ? 'sim' : 'não'); 

    if (!username || !login_token) {
      console.log('❌ [LOGIN] Username ou login_token ausente.');
      return new Response(JSON.stringify({
        success: false,
        message: 'Username e token são obrigatórios'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const { data: usuario, error: userError } = await supabaseClient.from('cartorio_usuarios').select(`
        id, 
        cartorio_id, 
        username, 
        email, 
        is_active, 
        user_id, 
        auth_user_id, 
        cartorios!inner(
          id, 
          nome, 
          is_active
        )
      `).eq('username', username).eq('is_active', true)
    .single();

    if (userError || !usuario) {
      console.log('❌ [LOGIN] Usuário não encontrado ou inativo na tabela cartorio_usuarios:', userError?.message || 'Usuário não encontrado.');
      return new Response(JSON.stringify({
        success: false,
        message: 'Credenciais inválidas'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    if (!usuario.cartorios.is_active) {
      console.log('❌ [LOGIN] Cartório associado ao usuário inativo.');
      return new Response(JSON.stringify({
        success: false,
        message: 'Cartório associado inativo. Entre em contato com o suporte.'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✅ [LOGIN] Usuário e cartório ativos encontrados:', usuario.username);

    const { data: acesso, error: acessoError } = await supabaseClient.from('acessos_cartorio').select('id, cartorio_id, login_token, data_expiracao, ativo').eq('cartorio_id', usuario.cartorio_id)
    .eq('login_token', login_token)
    .eq('ativo', true)
    .gte('data_expiracao', new Date().toISOString())
    .single();

    if (acessoError || !acesso) {
      console.log('❌ [LOGIN] Token de acesso inválido, inativo ou expirado:', acessoError?.message || 'Token não encontrado/válido.');
      return new Response(JSON.stringify({
        success: false,
        message: 'Token de acesso inválido, inativo ou expirado.'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✅ [LOGIN] Token de acesso validado com sucesso na tabela acessos_cartorio.');

    let authUser;
    if (usuario.auth_user_id) {
      const { data: existingAuthUser, error: getAuthUserError } = await supabaseClient.auth.admin.getUserById(usuario.auth_user_id);
      if (existingAuthUser.user) {
        authUser = existingAuthUser.user;
        console.log('✅ [LOGIN] Usuário existente no Supabase Auth:', authUser.id);
      } else {
        console.log('⚠️ [LOGIN] auth_user_id inválido ou usuário inexistente no Supabase Auth. Criando novo...');
        const { data: newAuthUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email: usuario.email,
          password: login_token,
          email_confirm: true,
          user_metadata: {
            username: usuario.username,
            cartorio_id: usuario.cartorio_id,
            db_user_id: usuario.id
          }
        });
        if (createError || !newAuthUser?.user) {
          console.error('❌ [LOGIN] Erro ao criar usuário no Supabase Auth:', createError?.message);
          return new Response(JSON.stringify({
            success: false,
            message: 'Erro ao criar sessão de autenticação'
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        authUser = newAuthUser.user;
        await supabaseClient.from('cartorio_usuarios').update({
          auth_user_id: authUser.id
        }).eq('id', usuario.id);
      }
    } else {
      console.log('🔄 [LOGIN] auth_user_id não presente. Criando usuário no Supabase Auth...');
      const { data: newAuthUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email: usuario.email,
        password: login_token,
        email_confirm: true,
        user_metadata: {
          username: usuario.username,
          cartorio_id: usuario.cartorio_id,
          db_user_id: usuario.id
        }
      });
      if (createError || !newAuthUser?.user) {
        console.error('❌ [LOGIN] Erro ao criar usuário no Supabase Auth:', createError?.message);
        return new Response(JSON.stringify({
          success: false,
          message: 'Erro ao criar sessão de autenticação'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      authUser = newAuthUser.user;
      await supabaseClient.from('cartorio_usuarios').update({
        auth_user_id: authUser.id
      }).eq('id', usuario.id);
    }
    
    console.log('🔑 [LOGIN] Gerando tokens de sessão para o usuário Supabase Auth:', authUser.id);
    
    // *** CORREÇÃO: Usando generateSession ***
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.generateSession(authUser.id);

    if (sessionError || !sessionData?.session) {
      console.error('❌ [LOGIN] Erro ao gerar tokens de sessão com generateSession:', sessionError?.message);
      return new Response(JSON.stringify({
        success: false,
        message: 'Erro interno na geração de tokens de sessão'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const accessToken = sessionData.session.access_token;
    const refreshToken = sessionData.session.refresh_token;

    if (!accessToken || !refreshToken) {
      console.error('❌ [LOGIN] AccessToken ou RefreshToken não encontrados na sessão gerada pelo generateSession.');
      return new Response(JSON.stringify({
        success: false,
        message: 'Falha ao obter tokens de sessão válidos'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('✅ [LOGIN] Login e geração de tokens concluídos com sucesso para:', username);
    return new Response(JSON.stringify({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        cartorio_id: usuario.cartorio_id,
        cartorio_nome: usuario.cartorios.nome,
        auth_user_id: authUser.id
      },
      access_token: accessToken,
      refresh_token: refreshToken
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('💥 [LOGIN] Erro geral na função login-cartorio:', error.message);
    return new Response(JSON.stringify({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});