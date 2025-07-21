
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

    // 3. Gerar ou obter email de autenticação (authEmail)
    let authEmail = userData.email;
    let emailUpdated = false;
    
    // Se não há email ou email é inválido, gerar placeholder determinístico
    if (!authEmail || authEmail.trim() === '') {
      // Gerar email placeholder único: username@cartorio-id.siplan.internal
      const cleanCartrioId = userData.cartorio_id.replace(/-/g, '');
      authEmail = `${userData.username.toLowerCase()}@${cleanCartrioId}.siplan.internal`;
      console.log(`ℹ️ [LOGIN] Email placeholder gerado: ${authEmail}`);
      
      // Atualizar o email na tabela cartorio_usuarios para consistência futura
      const { error: updateEmailError } = await supabase
        .from('cartorio_usuarios')
        .update({ email: authEmail })
        .eq('id', userData.id);
        
      if (updateEmailError) {
        console.error("❌ [LOGIN] Erro ao atualizar email placeholder:", updateEmailError);
      } else {
        console.log(`✅ [LOGIN] Email placeholder salvo na tabela cartorio_usuarios`);
        emailUpdated = true;
      }
    }

    // 4. Definir senha determinística
    const generatedPassword = `cartorio_${userData.cartorio_id}_${userData.id}`;
    
    // 5. Fluxo de autenticação robusto
    console.log(`ℹ️ [LOGIN] Tentando fazer signIn com email: ${authEmail}`);
    
    let authResult = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: generatedPassword
    });

    // Se o primeiro signIn falhou, verificar/sincronizar com auth.users
    if (authResult.error) {
      console.log(`ℹ️ [LOGIN] SignIn falhou: ${authResult.error.message}. Verificando usuário em auth.users...`);
      
      // Verificar se usuário existe no auth.users
      const { data: existingAuthUser, error: getAuthUserError } = await supabase.auth.admin.listUsers();
      
      if (getAuthUserError) {
        console.error("❌ [LOGIN] Erro ao verificar usuários existentes:", getAuthUserError);
        return new Response(
          JSON.stringify({ error: "Erro na verificação de usuários existentes" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Procurar usuário pelo email
      const existingUser = existingAuthUser.users.find(user => user.email === authEmail);
      
      if (existingUser) {
        // Usuário existe mas senha não bate - atualizar senha
        console.log(`ℹ️ [LOGIN] Usuário ${authEmail} existe em auth.users. Atualizando senha...`);
        
        const { error: updateError } = await supabase.auth.admin.updateUser(existingUser.id, {
          password: generatedPassword,
          email_confirm: true
        });
        
        if (updateError) {
          console.error("❌ [LOGIN] Erro ao atualizar senha do usuário:", updateError);
          return new Response(
            JSON.stringify({ error: "Erro ao atualizar senha do usuário" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log(`✅ [LOGIN] Senha para ${authEmail} atualizada com sucesso em auth.users`);
        
      } else {
        // Usuário não existe - criar novo
        console.log(`ℹ️ [LOGIN] Usuário ${authEmail} não existe em auth.users. Criando...`);
        
        const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
          email: authEmail,
          password: generatedPassword,
          email_confirm: true,
          user_metadata: {
            cartorio_id: userData.cartorio_id,
            user_id: userData.id,
            username: userData.username,
            nome: userData.nome
          }
        });
        
        if (createError) {
          console.error("❌ [LOGIN] Erro ao criar usuário:", createError);
          return new Response(
            JSON.stringify({ error: "Erro ao criar usuário no sistema de autenticação" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log(`✅ [LOGIN] Usuário ${authEmail} criado em auth.users`);
      }
      
      // Retentar signIn após sincronização
      console.log(`ℹ️ [LOGIN] Retentando signIn após sincronização...`);
      authResult = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: generatedPassword
      });
      
      if (authResult.error || !authResult.data.session) {
        console.error("❌ [LOGIN] Erro na retentativa de signIn:", authResult.error);
        return new Response(
          JSON.stringify({ error: "Erro final na autenticação após sincronização" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verificar se temos uma sessão válida
    if (!authResult.data.session) {
      console.error("❌ [LOGIN] Session não encontrada após autenticação");
      return new Response(
        JSON.stringify({ error: "Erro ao gerar sessão de autenticação" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = authResult.data.session.access_token;
    const refreshToken = authResult.data.session.refresh_token;

    if (!accessToken || !refreshToken) {
      console.error("❌ [LOGIN] Tokens de autenticação não gerados");
      return new Response(
        JSON.stringify({ error: "Tokens de autenticação não gerados ou inválidos" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ [LOGIN] Tokens gerados com sucesso para usuário: ${userData.nome}`);

    // 6. Retornar resposta de sucesso
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
