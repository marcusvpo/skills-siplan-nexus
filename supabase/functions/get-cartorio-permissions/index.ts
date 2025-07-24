// v2 - migrado para CUSTOM_SERVICE_KEY + jwtVerify
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verificar se é admin via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [AUTH] Missing or invalid authorization header');
      return new Response(JSON.stringify({ error: 'Authorization header obrigatório' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 [JWT] Processing admin JWT token');

    if (!jwtSecret) {
      console.error('❌ [JWT] JWT_SECRET not configured');
      return new Response(JSON.stringify({ error: 'JWT configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar JWT (para admins)
    let isAdmin = false;
    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
      console.log('🔐 [JWT] Token verified, checking admin status');
      
      // Para esta função, assumimos que apenas admins fazem esta operação
      isAdmin = payload.role === 'admin' || payload.is_admin === true;
      
      if (!isAdmin) {
        console.error('❌ [AUTH] User is not admin');
        return new Response(JSON.stringify({ error: 'Acesso negado: apenas administradores' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error('❌ [JWT] Token verification failed:', error.message);
      return new Response(JSON.stringify({ error: 'Token JWT inválido ou expirado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(
      supabaseUrl,
      customServiceKey || legacyServiceKey || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { cartorioId } = await req.json()

    console.log('🔐 [get-cartorio-permissions] Permissions request for:', cartorioId)

    if (!cartorioId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'cartorioId é obrigatório' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar todas as permissões do cartório
    const { data: permissoes, error: permissoesError } = await supabaseClient
      .from('cartorio_acesso_conteudo')
      .select(`
        *,
        sistemas:sistema_id(id, nome, ordem),
        produtos:produto_id(id, nome, ordem, sistema_id)
      `)
      .eq('cartorio_id', cartorioId)
      .eq('ativo', true)

    if (permissoesError) {
      console.error('❌ [get-cartorio-permissions] Error fetching permissions:', permissoesError)
      throw permissoesError
    }

    console.log('🔐 [PERMISSIONS] Raw permissions found:', permissoes?.length || 0)

    // Buscar todos os sistemas e produtos disponíveis
    const { data: todosOsSistemas, error: sistemasError } = await supabaseClient
      .from('sistemas')
      .select(`
        *,
        produtos:produtos(*)
      `)
      .order('ordem')

    if (sistemasError) {
      console.error('❌ [get-cartorio-permissions] Error fetching sistemas:', sistemasError)
      throw sistemasError
    }

    console.log('🔐 [PERMISSIONS] Total sistemas found:', todosOsSistemas?.length || 0)

    // Log detalhado das permissões para debug
    if (permissoes) {
      permissoes.forEach(p => {
        console.log('🔐 Permission:', {
          id: p.id,
          cartorio_id: p.cartorio_id,
          sistema_id: p.sistema_id,
          produto_id: p.produto_id,
          ativo: p.ativo
        })
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          permissoes: permissoes || [],
          todosOsSistemas: todosOsSistemas || []
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [get-cartorio-permissions] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Erro interno do servidor: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})