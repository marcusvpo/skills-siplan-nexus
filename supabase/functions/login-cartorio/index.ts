import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { username, login_token } = await req.json();

    if (!username || !login_token) {
      console.error("❌ [LOGIN] Username ou login_token não fornecidos");
      return new Response(
        JSON.stringify({ error: "Username e login_token são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`ℹ️ [LOGIN] Iniciando autenticação para username: ${username}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Validar login_token na tabela acessos_cartorio
    console.log(`ℹ️ [LOGIN] Validando login_token na tabela acessos_cartorio`);
    const { data: acessoData, error: acessoError } = await supabase
      .from('acessos_cartorio')
      .select('*')
      .eq('login_token', login_token)
      .single();

    if (acessoError || !acessoData) {
      console.error("❌ [LOGIN] Login token inválido ou não encontrado:", acessoError);
      return new Response(
        JSON.stringify({ error: "Token de login inválido" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`ℹ️ [LOGIN] Login token validado com sucesso para cartorio_id: ${acessoData.cartorio_id}`);

    // 2. Buscar usuário na tabela cartorio_usuarios
    console.log(`ℹ️ [LOGIN] Buscando usuário na tabela cartorio_usuarios`);
    const { data: userData, error: userError } = await supabase
      .from('cartorio_usuarios')
      .select('*')
      .eq('username', username)
      .eq('cartorio_id', acessoData.cartorio_id)
      .single();

    if (userError || !userData) {
      console.error("❌ [LOGIN] Usuário não encontrado:", userError);
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`ℹ️ [LOGIN] Usuário encontrado: ${userData.nome} (${userData.email})`);

    // 3. Gerar tokens de autenticação usando signInWithPassword
    console.log(`ℹ️ [LOGIN] Tentando fazer signIn com email: ${userData.email}`);
    
    // Primeiro, tentar fazer signIn
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: `cartorio_${userData.cartorio_id}_${userData.id}` // Senha padrão baseada nos IDs
    });

    let accessToken, refreshToken;

    if (signInError) {
      console.log(`ℹ️ [LOGIN] SignIn falhou, tentando criar usuário: ${signInError.message}`);
      
      // Se o signIn falhar, tentar criar o usuário
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: `cartorio_${userData.cartorio_id}_${userData.id}`,
        email_confirm: true,
        user_metadata: {
          cartorio_id: userData.cartorio_id,
          user_id: userData.id,
          username: userData.username,
          nome: userData.nome
        }
      });

      if (signUpError) {
        console.error("❌ [LOGIN] Erro ao criar usuário:", signUpError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar usuário no sistema de autenticação" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`ℹ️ [LOGIN] Usuário criado com sucesso, gerando tokens...`);
      
      // Agora fazer signIn com o usuário criado
      const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: `cartorio_${userData.cartorio_id}_${userData.id}`
      });

      if (newSignInError || !newSignInData.session) {
        console.error("❌ [LOGIN] Erro ao fazer signIn após criar usuário:", newSignInError);
        return new Response(
          JSON.stringify({ error: "Erro ao autenticar usuário recém-criado" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      accessToken = newSignInData.session.access_token;
      refreshToken = newSignInData.session.refresh_token;
      
    } else {
      // SignIn foi bem-sucedido
      if (!signInData.session) {
        console.error("❌ [LOGIN] Session não encontrada após signIn bem-sucedido");
        return new Response(
          JSON.stringify({ error: "Erro ao gerar sessão de autenticação" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      accessToken = signInData.session.access_token;
      refreshToken = signInData.session.refresh_token;
    }

    if (!accessToken || !refreshToken) {
      console.error("❌ [LOGIN] Tokens de autenticação não gerados");
      return new Response(
        JSON.stringify({ error: "Tokens de autenticação não gerados ou inválidos" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ [LOGIN] Tokens gerados com sucesso para usuário: ${userData.nome}`);

    // 4. Retornar resposta de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: userData.id,
          username: userData.username,
          nome: userData.nome,
          email: userData.email,
          cartorio_id: userData.cartorio_id
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("❌ [LOGIN] Erro crítico no fluxo de autenticação:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});