import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const customServiceKey = Deno.env.get('CUSTOM_SERVICE_KEY');
const legacyServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verificar se é admin via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [get-admin-stats] Missing or invalid authorization header');
      return new Response(JSON.stringify({ error: 'Authorization header obrigatório' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      supabaseUrl,
      customServiceKey || legacyServiceKey || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar se é admin através do token Supabase
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error('❌ [get-admin-stats] Invalid user token:', userError?.message);
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se o usuário é admin
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('admins')
      .select('*')
      .eq('email', userData.user.email)
      .single();

    if (adminError || !adminCheck) {
      console.error('❌ [get-admin-stats] User is not admin:', userData.user.email);
      return new Response(JSON.stringify({ error: 'Usuário não é administrador' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📊 [get-admin-stats] Fetching admin statistics');

    // Buscar estatísticas usando service key para bypassar RLS
    const [
      { count: adminCount, error: adminError2 },
      { count: cartorioUsersCount, error: cartorioUsersError },
      { count: videoaulasCount, error: videoaulasError },
      { count: sistemasCount, error: sistemasError },
      { count: produtosCount, error: produtosError }
    ] = await Promise.all([
      supabaseClient.from('admins').select('*', { count: 'exact', head: true }),
      supabaseClient.from('cartorio_usuarios').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseClient.from('video_aulas').select('*', { count: 'exact', head: true }),
      supabaseClient.from('sistemas').select('*', { count: 'exact', head: true }),
      supabaseClient.from('produtos').select('*', { count: 'exact', head: true })
    ]);

    // Verificar erros
    if (adminError2 || cartorioUsersError || videoaulasError || sistemasError || produtosError) {
      const errors = {
        adminError: adminError2,
        cartorioUsersError,
        videoaulasError,
        sistemasError,
        produtosError
      };
      console.error('❌ [get-admin-stats] Error fetching stats:', errors);
      throw new Error('Erro ao buscar estatísticas');
    }

    const stats = {
      adminCount: adminCount || 0,
      cartorioUsersCount: cartorioUsersCount || 0,
      videoaulasCount: videoaulasCount || 0,
      sistemasCount: sistemasCount || 0,
      produtosCount: produtosCount || 0
    };

    console.log('✅ [get-admin-stats] Statistics retrieved:', stats);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: stats
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [get-admin-stats] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})