// v2 - migrado para CUSTOM_SERVICE_KEY + jwtVerify
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuração de chaves - prioriza CUSTOM_SERVICE_KEY
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const customServiceKey = Deno.env.get('CUSTOM_SERVICE_KEY');
const legacyServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Log de inicialização
console.log('🔧 [Init] Using service key:', customServiceKey ? 'Present' : 'Missing');
console.log('🔧 [Init] Key source:', customServiceKey ? 'CUSTOM_SERVICE_KEY (NEW)' : 'LEGACY_FALLBACK');

const supabase = createClient(
  supabaseUrl,
  customServiceKey || legacyServiceKey || ''
);

interface VerifyRequest {
  token: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  console.log('=== VERIFY TOKEN FUNCTION START ===');
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 [TOKEN] Verifying token...');

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
      console.log('❌ [TOKEN] Token not found:', error?.message);
      return new Response(JSON.stringify({
        valid: false,
        error: 'Token não encontrado',
        details: error?.message
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const now = new Date();
    const expirationDate = new Date(acesso.data_expiracao);
    const isExpired = expirationDate < now;
    const isActive = acesso.ativo;
    const cartorioActive = acesso.cartorios?.is_active;

    console.log('✅ [TOKEN] Token verification result:', {
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [TOKEN] Error in verify-token:', error);
    return new Response(JSON.stringify({
      valid: false,
      error: 'Erro interno',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});