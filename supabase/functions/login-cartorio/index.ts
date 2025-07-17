
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface LoginRequest {
  username: string;
  login_token: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  console.log('=== LOGIN CARTORIO FUNCTION START ===');
  console.log('Method:', req.method);
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return new Response(JSON.stringify({ 
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const requestData = await req.json() as LoginRequest;
    console.log('Request data received:', { 
      username: requestData.username || null,
      token: requestData.login_token ? '***' : null 
    });
    
    const { username, login_token } = requestData;

    // Validação de entrada
    if (!username || !login_token) {
      console.log('Missing required fields:', { username: !!username, login_token: !!login_token });
      return new Response(JSON.stringify({ 
        error: 'Username e token são obrigatórios',
        code: 'MISSING_FIELDS'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Searching for token and user in database...');
    
    // Buscar o acesso do cartório com JOIN otimizado
    const { data: acesso, error: acessoError } = await supabase
      .from('acessos_cartorio')
      .select(`
        id,
        login_token,
        cartorio_id,
        data_expiracao,
        ativo,
        email_contato,
        cartorios!acessos_cartorio_fk (
          id,
          nome,
          cidade,
          estado,
          is_active
        )
      `)
      .eq('login_token', login_token)
      .single();

    console.log('Token lookup result:', { 
      found: !!acesso, 
      error: acessoError?.message,
      cartorioActive: acesso?.cartorios?.is_active,
      tokenActive: acesso?.ativo
    });

    if (acessoError || !acesso) {
      console.log('Token not found or database error:', acessoError);
      return new Response(JSON.stringify({ 
        error: 'Token não encontrado ou inválido',
        code: 'INVALID_TOKEN',
        debug: acessoError?.message
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificações de integridade
    if (!acesso.ativo) {
      console.log('Token is inactive');
      return new Response(JSON.stringify({ 
        error: 'Token foi desativado pelo administrador',
        code: 'INACTIVE_TOKEN'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!acesso.cartorios?.is_active) {
      console.log('Cartorio is inactive');
      return new Response(JSON.stringify({ 
        error: 'Cartório está inativo',
        code: 'INACTIVE_CARTORIO'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar expiração
    const expirationDate = new Date(acesso.data_expiracao);
    const now = new Date();
    
    console.log('Token expiration check:', {
      expiration: expirationDate.toISOString(),
      now: now.toISOString(),
      isExpired: expirationDate < now
    });

    if (expirationDate < now) {
      console.log('Token expired');
      return new Response(JSON.stringify({ 
        error: 'Token expirado',
        code: 'EXPIRED_TOKEN',
        expirationDate: acesso.data_expiracao,
        daysExpired: Math.ceil((now.getTime() - expirationDate.getTime()) / (1000 * 60 * 60 * 24))
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar o usuário do cartório
    console.log('Searching for cartorio user...');
    const { data: usuario, error: usuarioError } = await supabase
      .from('cartorio_usuarios')
      .select('*')
      .eq('cartorio_id', acesso.cartorio_id)
      .eq('username', username)
      .eq('is_active', true)
      .single();

    console.log('User lookup result:', { 
      found: !!usuario, 
      error: usuarioError?.message,
      userActive: usuario?.is_active
    });

    if (usuarioError || !usuario) {
      console.log('User not found or database error:', usuarioError);
      return new Response(JSON.stringify({ 
        error: 'Usuário não encontrado ou inativo',
        code: 'USER_NOT_FOUND',
        debug: usuarioError?.message
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // --- NOVA LÓGICA: Autenticar ou Criar no Supabase Auth ---
    console.log('Attempting to authenticate with Supabase Auth...');
    
    let supabaseAuthUser = null;
    const authEmail = acesso.email_contato || `${usuario.username}@${acesso.cartorios.nome.toLowerCase().replace(/\s+/g, '')}.cartorio.local`;

    console.log('Auth email determined:', authEmail);

    // 1. Tenta encontrar um usuário Auth existente pelo email
    const { data: { users: existingAuthUsers }, error: listUsersError } = await supabase.auth.admin.listUsers({
        perPage: 1000,
        page: 1
    });

    if (listUsersError) {
        console.error('Error listing Supabase Auth users:', listUsersError);
        return new Response(JSON.stringify({ 
          error: 'Erro interno de autenticação',
          code: 'AUTH_LIST_ERROR',
          debug: listUsersError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Procurar por usuário existente
    const existingUser = existingAuthUsers?.find(u => u.email === authEmail);
    
    if (existingUser) {
        supabaseAuthUser = existingUser;
        console.log('Found existing Supabase Auth user:', supabaseAuthUser.id);
    } else {
        // 2. Se não existir, cria um novo usuário Auth
        console.log('Supabase Auth user not found. Creating a new one...');
        const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        const { data: newAuthUserData, error: createUserError } = await supabase.auth.admin.createUser({
            email: authEmail,
            password: randomPassword,
            email_confirm: true,
            user_metadata: {
                cartorio_id: acesso.cartorio_id,
                cartorio_name: acesso.cartorios.nome,
                app_user_id: usuario.id,
                username: usuario.username,
                role: 'cartorio_user'
            }
        });

        if (createUserError) {
            console.error('Error creating Supabase Auth user:', createUserError);
            return new Response(JSON.stringify({ 
              error: 'Erro ao criar usuário de autenticação',
              code: 'AUTH_CREATE_ERROR',
              debug: createUserError.message
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        supabaseAuthUser = newAuthUserData.user;
        console.log('New Supabase Auth user created:', supabaseAuthUser.id);
    }

    // 3. Autentica o usuário Auth para obter a sessão (access_token e refresh_token)
    const { data: sessionData, error: signInError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: authEmail,
        options: {
            redirectTo: 'https://app.siplan.com.br/dashboard'
        }
    });

    if (signInError) {
        console.error('Error generating auth link:', signInError);
        return new Response(JSON.stringify({ 
          error: 'Erro ao gerar sessão de autenticação',
          code: 'AUTH_SESSION_ERROR',
          debug: signInError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Como generateLink não retorna uma sessão diretamente, vamos criar uma usando admin.signInWithPassword
    const { data: { session }, error: sessionError } = await supabase.auth.admin.signInWithPassword({
        email: authEmail,
        password: 'temp_password_will_be_replaced'
    });

    // Se a senha temporária não funcionar, vamos gerar uma sessão via admin
    let finalSession = null;
    if (sessionError || !session) {
        // Usar signInUserById como alternativa
        const { data: adminSession, error: adminSignInError } = await supabase.auth.admin.signInUserById(supabaseAuthUser.id);
        
        if (adminSignInError || !adminSession?.session) {
            console.error('Error signing in Supabase Auth user:', adminSignInError);
            return new Response(JSON.stringify({ 
              error: 'Erro ao criar sessão de autenticação',
              code: 'AUTH_SIGNIN_ERROR',
              debug: adminSignInError?.message
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        finalSession = adminSession.session;
    } else {
        finalSession = session;
    }

    console.log('Supabase Auth session generated:', {
        userId: finalSession.user.id,
        hasAccessToken: !!finalSession.access_token,
        hasRefreshToken: !!finalSession.refresh_token,
        expiresAt: finalSession.expires_at
    });
    
    console.log('Login successful for:', {
      cartorio: acesso.cartorios.nome,
      usuario: usuario.username
    });

    // Retorna a sessão do Supabase Auth para o cliente
    return new Response(JSON.stringify({
      success: true,
      // Retornar os tokens reais do Supabase Auth
      access_token: finalSession.access_token,
      refresh_token: finalSession.refresh_token,
      expires_in: finalSession.expires_in,
      expires_at: finalSession.expires_at,
      token_type: finalSession.token_type,
      user: {
          id: finalSession.user.id,
          email: finalSession.user.email,
          user_metadata: finalSession.user.user_metadata
      },
      // Dados customizados do seu app
      cartorio_data: {
        id: acesso.cartorio_id,
        nome: acesso.cartorios.nome,
        cidade: acesso.cartorios.cidade,
        estado: acesso.cartorios.estado
      },
      app_user_data: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email
      },
      message: `Bem-vindo(a), ${usuario.username}! Acesso autorizado para ${acesso.cartorios.nome}.`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error in login-cartorio:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
