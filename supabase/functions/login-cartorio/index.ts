
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

    console.log('Creating authentication token...');
    
    // Criar token de autenticação customizado
    const authPayload = {
      cartorio_id: acesso.cartorio_id,
      cartorio_nome: acesso.cartorios.nome,
      user_id: usuario.id,
      username: usuario.username,
      login_token: login_token,
      role: 'cartorio_user',
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 8), // 8 horas
      iat: Math.floor(Date.now() / 1000),
      iss: 'siplan-skills'
    };

    // Usar base64 simples para o token customizado
    const customToken = `CART-${btoa(JSON.stringify(authPayload))}`;
    
    console.log('Login successful for:', {
      cartorio: acesso.cartorios.nome,
      usuario: usuario.username
    });

    return new Response(JSON.stringify({
      success: true,
      token: customToken,
      cartorio: {
        id: acesso.cartorio_id,
        nome: acesso.cartorios.nome,
        cidade: acesso.cartorios.cidade,
        estado: acesso.cartorios.estado
      },
      usuario: {
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
