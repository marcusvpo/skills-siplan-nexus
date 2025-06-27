
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? '';

interface LoginRequest {
  token: string;
}

interface AcessoCartorio {
  id: string;
  login_token: string;
  cartorio_id: string;
  data_expiracao: string;
  ativo: boolean;
  cartorios: {
    id: string;
    nome: string;
    is_active: boolean;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  console.log('=== LOGIN CARTORIO FUNCTION START ===');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const requestData = await req.json() as LoginRequest;
    console.log('Request data received:', { token: requestData.token ? '***' : null });
    
    const { token } = requestData;

    if (!token) {
      console.log('No token provided');
      return new Response(JSON.stringify({ 
        error: 'Token é obrigatório',
        code: 'MISSING_TOKEN'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Searching for token in database...');
    
    // Buscar o acesso do cartório com relacionamento usando nome correto da FK
    const { data: acesso, error: acessoError } = await supabase
      .from('acessos_cartorio')
      .select(`
        id,
        login_token,
        cartorio_id,
        data_expiracao,
        ativo,
        cartorios!acessos_cartorio_fk (
          id,
          nome,
          is_active
        )
      `)
      .eq('login_token', token)
      .single();

    console.log('Database query result:', { 
      found: !!acesso, 
      error: acessoError?.message,
      cartorioActive: acesso?.cartorios?.is_active,
      tokenActive: acesso?.ativo
    });

    if (acessoError || !acesso) {
      console.log('Token not found or database error:', acessoError);
      return new Response(JSON.stringify({ 
        error: 'Token inválido ou não encontrado',
        code: 'INVALID_TOKEN',
        debug: acessoError?.message
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se o token está ativo
    if (!acesso.ativo) {
      console.log('Token is inactive');
      return new Response(JSON.stringify({ 
        error: 'Token foi desativado',
        code: 'INACTIVE_TOKEN'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se o cartório está ativo
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

    // Verificar se o token não expirou
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
        expirationDate: acesso.data_expiracao
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Creating JWT token...');
    
    // Criar JWT personalizado simples (sem biblioteca externa que causa problemas)
    const jwtPayload = {
      cartorio_id: acesso.cartorio_id,
      cartorio_nome: acesso.cartorios.nome,
      login_token: token,
      role: 'cartorio_user',
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 8), // 8 horas
      iat: Math.floor(Date.now() / 1000),
      iss: 'siplan-skills'
    };

    // Criar um token simples ao invés de JWT complexo
    const customToken = `SIPLAN-${btoa(JSON.stringify(jwtPayload))}`;
    
    console.log('Token created successfully');
    console.log('Login successful for cartorio:', acesso.cartorios.nome);

    return new Response(JSON.stringify({
      success: true,
      cartorio: {
        id: acesso.cartorio_id,
        nome: acesso.cartorios.nome,
        token: customToken
      },
      message: `Bem-vindo ao ${acesso.cartorios.nome}!`
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
