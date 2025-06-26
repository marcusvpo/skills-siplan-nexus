
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface VerifyRequest {
  token: string;
}

serve(async (req) => {
  console.log('=== VERIFY TOKEN FUNCTION START ===');
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { token } = await req.json() as VerifyRequest;

    if (!token) {
      return new Response(JSON.stringify({
        valid: false,
        error: 'Token não fornecido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Verifying token...');

    const { data: acesso, error } = await supabase
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

    if (error || !acesso) {
      console.log('Token not found:', error?.message);
      return new Response(JSON.stringify({
        valid: false,
        error: 'Token não encontrado',
        details: error?.message
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date();
    const expirationDate = new Date(acesso.data_expiracao);
    const isExpired = expirationDate < now;
    const isActive = acesso.ativo;
    const cartorioActive = acesso.cartorios?.is_active;

    console.log('Token verification result:', {
      isExpired,
      isActive,
      cartorioActive,
      cartorioName: acesso.cartorios?.nome
    });

    return new Response(JSON.stringify({
      valid: !isExpired && isActive && cartorioActive,
      isExpired,
      isActive,
      cartorioActive,
      expirationDate: acesso.data_expiracao,
      cartorio: {
        id: acesso.cartorio_id,
        nome: acesso.cartorios?.nome
      },
      details: {
        tokenStatus: isActive ? 'Ativo' : 'Inativo',
        cartorioStatus: cartorioActive ? 'Ativo' : 'Inativo',
        expiresIn: Math.max(0, Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in verify-token:', error);
    return new Response(JSON.stringify({
      valid: false,
      error: 'Erro interno',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
