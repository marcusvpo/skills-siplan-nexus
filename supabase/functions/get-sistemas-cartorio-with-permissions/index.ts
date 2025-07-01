import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  console.log('=== GET SISTEMAS CARTORIO WITH PERMISSIONS ===');
  
  try {
    // Get cartorio ID from custom header or token
    const customAuth = req.headers.get('x-custom-auth') || req.headers.get('authorization');
    
    if (!customAuth) {
      return new Response(JSON.stringify({
        error: 'Token de autenticação necessário'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    let cartorioId: string | null = null;
    
    if (customAuth.startsWith('CART-')) {
      // Decode the CART token
      try {
        const tokenData = customAuth.replace('CART-', '');
        const decodedData = JSON.parse(atob(tokenData));
        cartorioId = decodedData.cartorio_id;
        console.log('Extracted cartorio_id from CART token:', cartorioId);
      } catch (e) {
        console.error('Error decoding CART token:', e);
        return new Response(JSON.stringify({
          error: 'Token inválido'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (!cartorioId) {
      return new Response(JSON.stringify({
        error: 'ID do cartório não encontrado no token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // First, check if cartorio has any specific permissions
    const { data: permissions, error: permError } = await supabase
      .from('cartorio_acesso_conteudo')
      .select('*')
      .eq('cartorio_id', cartorioId)
      .eq('ativo', true);
    
    if (permError) {
      console.error('Error fetching permissions:', permError);
      throw new Error('Erro ao verificar permissões');
    }
    
    console.log('Cartorio permissions:', permissions?.length || 0);
    
    // If no specific permissions are set, return all systems
    if (!permissions || permissions.length === 0) {
      console.log('No specific permissions found, returning all systems');
      
      const { data: allSystems, error: systemsError } = await supabase
        .from('sistemas')
        .select(`
          *,
          produtos (
            *,
            video_aulas (*)
          )
        `)
        .order('ordem', { ascending: true });
      
      if (systemsError) {
        throw new Error('Erro ao carregar sistemas');
      }
      
      return new Response(JSON.stringify({
        sistemas: allSystems || [],
        hasPermissions: false
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // If specific permissions exist, filter accordingly
    const systemIds = [...new Set(permissions
      .filter(p => p.sistema_id)
      .map(p => p.sistema_id))];
    
    const productIds = [...new Set(permissions
      .filter(p => p.produto_id)
      .map(p => p.produto_id))];
    
    console.log('Allowed system IDs:', systemIds);
    console.log('Allowed product IDs:', productIds);
    
    // Get systems that are either directly allowed or have allowed products
    const { data: allowedSystems, error: systemsError } = await supabase
      .from('sistemas')
      .select(`
        *,
        produtos (
          *,
          video_aulas (*)
        )
      `)
      .or(`id.in.(${systemIds.join(',')}),produtos.id.in.(${productIds.join(',')})`)
      .order('ordem', { ascending: true });
    
    if (systemsError) {
      console.error('Error fetching systems:', systemsError);
      throw new Error('Erro ao carregar sistemas permitidos');
    }
    
    // Filter products within systems if needed
    const filteredSystems = allowedSystems?.map(system => {
      if (systemIds.includes(system.id)) {
        // System is fully allowed, return all products
        return system;
      } else {
        // Only specific products are allowed
        const allowedProducts = system.produtos?.filter(product => 
          productIds.includes(product.id)
        ) || [];
        
        return {
          ...system,
          produtos: allowedProducts
        };
      }
    }).filter(system => 
      // Keep systems that either have allowed products or are fully allowed
      systemIds.includes(system.id) || (system.produtos && system.produtos.length > 0)
    );
    
    return new Response(JSON.stringify({
      sistemas: filteredSystems || [],
      hasPermissions: true,
      permissions: permissions
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in get-sistemas-cartorio-with-permissions:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
