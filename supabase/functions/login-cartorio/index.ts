import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT } from "https://esm.sh/jose@4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const { username, login_token } = await req.json();
    if (!username || !login_token) {
      console.error("❌ [LOGIN] Username ou login_token não fornecidos");
      return new Response(JSON.stringify({
        error: "Username e login_token são obrigatórios"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`ℹ️ [LOGIN] Iniciando autenticação para username: ${username}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const customServiceKey = Deno.env.get('CUSTOM_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log(`🔧 [LOGIN] Using custom service key: ${customServiceKey ? 'Present' : 'Missing'}`);
    const supabase = createClient(supabaseUrl, customServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Validar login_token na tabela acessos_cartorio (tolerante a espaços/caixa).
    const tokenNormalizado = String(login_token).trim();
    console.log(`ℹ️ [LOGIN] Validando login_token na tabela acessos_cartorio`);
    const { data: acessosData, error: acessoError } = await supabase
      .from('acessos_cartorio')
      .select('*')
      .ilike('login_token', tokenNormalizado)
      .limit(1);

    const acessoData = acessosData?.[0];

    if (acessoError || !acessoData) {
      console.error("❌ [LOGIN] Login token inválido ou não encontrado:", acessoError);
      return new Response(JSON.stringify({
        error: "Token de login inválido"
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (acessoData.ativo === false) {
      console.error("❌ [LOGIN] Token desativado");
      return new Response(JSON.stringify({
        error: "Este token de acesso está desativado. Contate o administrador."
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (acessoData.data_expiracao && new Date(acessoData.data_expiracao) < new Date()) {
      console.error("❌ [LOGIN] Token expirado");
      return new Response(JSON.stringify({
        error: "Este token de acesso expirou. Contate o administrador."
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`ℹ️ [LOGIN] Login token validado com sucesso para cartorio_id: ${acessoData.cartorio_id}`);

    // 2. Buscar usuário na tabela cartorio_usuarios com depuração detalhada
    console.log(`ℹ️ [LOGIN] Buscando usuário na tabela cartorio_usuarios com filtros: username=${username}, cartorio_id=${acessoData.cartorio_id}`);
    const usernameNormalizado = String(username).trim();
    let { data: userData, error: userError } = await supabase
      .from('cartorio_usuarios')
      .select('*')
      .eq('username', usernameNormalizado)
      .eq('cartorio_id', acessoData.cartorio_id)
      .single();

    if (userError || !userData) {
      console.error("❌ [LOGIN] Nenhum usuário encontrado com filtros exatos. Tentando busca case-insensitive...");

      // Busca case-insensitive com ilike
      const { data: userDataIlike, error: ilikeError } = await supabase
        .from('cartorio_usuarios')
        .select('*')
        .ilike('username', usernameNormalizado)
        .eq('cartorio_id', acessoData.cartorio_id)
        .single();

      if (ilikeError || !userDataIlike) {
        console.error("❌ [LOGIN] Nenhum usuário encontrado mesmo com ilike:", ilikeError);
        // Depuração adicional: Busca todos os usuários para o cartorio_id
        const { data: allUsers, error: allError } = await supabase
          .from('cartorio_usuarios')
          .select('*')
          .eq('cartorio_id', acessoData.cartorio_id);

        if (allError) {
          console.error("❌ [LOGIN] Erro ao buscar todos os usuários para depuração:", allError);
        } else {
          console.log(`ℹ️ [LOGIN] Todos os usuários na tabela para cartorio_id (depuração): ${JSON.stringify(allUsers, null, 2)}`);
        }

        return new Response(JSON.stringify({
          error: "Usuário não encontrado na tabela cartorio_usuarios"
        }), {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } else {
        userData = userDataIlike;
        console.log(`✅ [LOGIN] Usuário encontrado com busca case-insensitive: ${userData.nome} (${userData.email})`);
      }
    } else {
      console.log(`ℹ️ [LOGIN] Usuário encontrado com filtros exatos: ${userData.nome} (${userData.email})`);
    }

    // 3. Gerar JWT customizado (substituindo completamente o Supabase Auth)
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      console.error("❌ [LOGIN] JWT_SECRET não configurado");
      return new Response(JSON.stringify({
        error: "Configuração de JWT não encontrada"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`ℹ️ [LOGIN] Gerando JWT customizado para usuário: ${userData.nome}`);
    
    // Criar JWT com claims customizados
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (24 * 60 * 60); // 24 horas
    
    const jwt = await new SignJWT({
      cartorio_id: userData.cartorio_id,
      user_id: userData.id,
      username: userData.username,
      email: userData.email || `${userData.username}@${userData.cartorio_id.replace(/-/g, '')}.siplan.internal`,
      nome: userData.nome,
      iss: 'siplan-app',
      aud: 'siplan-users'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .sign(new TextEncoder().encode(jwtSecret));

    console.log(`✅ [LOGIN] JWT gerado com sucesso para usuário: ${userData.nome}`);

    // 4. Registrar sessão do cartório
    console.log(`ℹ️ [LOGIN] Registrando sessão para cartorio_id: ${userData.cartorio_id}`);
    try {
      const { error: sessionError } = await supabase.rpc('upsert_cartorio_session', {
        p_cartorio_id: userData.cartorio_id
      });

      if (sessionError) {
        console.error("⚠️ [LOGIN] Erro ao registrar sessão (não crítico):", sessionError);
      } else {
        console.log(`✅ [LOGIN] Sessão registrada com sucesso`);
      }
    } catch (sessionErr) {
      console.error("⚠️ [LOGIN] Erro inesperado ao registrar sessão:", sessionErr);
    }

    return new Response(JSON.stringify({
      success: true,
      access_token: jwt,
      user: {
        id: userData.id,
        username: userData.username,
        nome: userData.nome,
        email: userData.email || `${userData.username}@${userData.cartorio_id.replace(/-/g, '')}.siplan.internal`,
        cartorio_id: userData.cartorio_id
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("❌ [LOGIN] Erro crítico no fluxo de autenticação:", error);
    return new Response(JSON.stringify({
      error: "Erro interno do servidor"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
