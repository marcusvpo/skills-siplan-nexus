import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 [Init] Starting get-cartorio-permissions function');
    
    // Get service key from environment
    const serviceKey = Deno.env.get('CUSTOM_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey) {
      throw new Error('Service key não encontrado');
    }

    // Initialize Supabase client with service key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('❌ [AUTH] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify if user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('❌ [AUTH] Invalid token or user not found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', user.email)
      .single();

    if (adminError || !adminData) {
      console.log('❌ [AUTH] User is not admin');
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [AUTH] Admin verified:', user.email);

    // Get request body
    const { cartorio_id } = await req.json();
    
    if (!cartorio_id) {
      return new Response(
        JSON.stringify({ error: 'cartorio_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 [PERMISSIONS] Fetching permissions for cartorio:', cartorio_id);

    // Get cartorio permissions
    const { data: permissions, error: permissionsError } = await supabase
      .from('cartorio_acesso_conteudo')
      .select('sistema_id, produto_id, ativo')
      .eq('cartorio_id', cartorio_id)
      .eq('ativo', true);

    if (permissionsError) {
      console.error('❌ [PERMISSIONS] Error fetching permissions:', permissionsError);
      throw permissionsError;
    }

    console.log('✅ [PERMISSIONS] Found permissions:', permissions?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        data: permissions || []
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [ERROR] Function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})