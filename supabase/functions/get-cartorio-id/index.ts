
// v2 - migrado para CUSTOM_SERVICE_KEY + jwtVerify
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'
import { jwtVerify } from 'https://deno.land/x/jose@v4.14.6/index.ts';

// Configuração de chaves - prioriza CUSTOM_SERVICE_KEY
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const customServiceKey = Deno.env.get('CUSTOM_SERVICE_KEY');
const legacyServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const jwtSecret = Deno.env.get('JWT_SECRET');

// Log de inicialização
console.log('🔧 [Init] Using service key:', customServiceKey ? 'Present' : 'Missing');
console.log('🔧 [Init] Key source:', customServiceKey ? 'CUSTOM_SERVICE_KEY (NEW)' : 'LEGACY_FALLBACK');
console.log('🔧 [Init] JWT Secret:', jwtSecret ? 'Present' : 'Missing');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      supabaseUrl,
      customServiceKey || legacyServiceKey || ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let cartorioId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      // JWT customizado
      const token = authHeader.replace('Bearer ', '');
      console.log('🔐 [JWT] Processing JWT token for cartorio_id extraction');

      if (jwtSecret) {
        try {
          const secret = new TextEncoder().encode(jwtSecret);
          const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
          cartorioId = payload.cartorio_id as string;
          console.log('✅ [JWT] Extracted cartorio_id:', cartorioId);
        } catch (error) {
          console.error('❌ [JWT] Token verification failed:', error.message);
        }
      }
    } else if (authHeader.startsWith('CART-')) {
      // Compatibilidade com token legacy
      const token = authHeader;
      console.log('🔄 [LEGACY] Processing legacy CART- token');
      
      const { data: acesso } = await supabase
        .from('acessos_cartorio')
        .select('cartorio_id')
        .eq('login_token', token)
        .eq('ativo', true)
        .gte('data_expiracao', new Date().toISOString())
        .single();

      cartorioId = acesso?.cartorio_id || null;
    }

    return new Response(
      JSON.stringify({ cartorio_id: cartorioId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-cartorio-id:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
