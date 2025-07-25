
// v2 - migrado para CUSTOM_SERVICE_KEY + jwtVerify
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jwtVerify } from 'https://deno.land/x/jose@v4.14.6/index.ts';

// Configuração de chaves - prioriza CUSTOM_SERVICE_KEY
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const customServiceKey = Deno.env.get('CUSTOM_SERVICE_KEY');
const legacyServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const jwtSecret = Deno.env.get('JWT_SECRET');

// Log de inicialização
console.log('🔧 [Edge Function Init] Using service key:', customServiceKey ? 'Present' : 'Missing');
console.log('🔧 [Edge Function Init] Key source:', customServiceKey ? 'CUSTOM_SERVICE_KEY (NEW)' : 'LEGACY_FALLBACK');
console.log('🔧 [Edge Function Init] JWT Secret:', jwtSecret ? 'Present' : 'Missing');

const supabase = createClient(
  supabaseUrl,
  customServiceKey || legacyServiceKey || ''
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
    // Get cartorio ID from JWT or legacy CART token
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
    
    // Check if it's a legacy CART token
    if (customAuth.startsWith('CART-')) {
      try {
        const tokenData = customAuth.replace('CART-', '');
        const decodedData = JSON.parse(atob(tokenData));
        cartorioId = decodedData.cartorio_id;
        console.log('🔍 [JWT] Extracted cartorio_id from CART token:', cartorioId);
      } catch (e) {
        console.error('❌ [JWT] Error decoding CART token:', e);
        return new Response(JSON.stringify({
          error: 'Token inválido'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // It's a JWT token - validate and extract cartorio_id
      try {
        const token = customAuth.replace('Bearer ', '');
        
        if (!jwtSecret) {
          console.error('❌ [JWT] JWT_SECRET not configured');
          return new Response(JSON.stringify({
            error: 'Configuração de autenticação inválida'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        console.log('🔍 [JWT] Verifying JWT token...');
        const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
        
        cartorioId = payload.cartorio_id as string;
        console.log('✅ [JWT] Successfully extracted cartorio_id:', cartorioId);
        console.log('🔍 [JWT] Full payload:', { 
          cartorio_id: payload.cartorio_id,
          user_id: payload.user_id,
          username: payload.username 
        });
        
      } catch (e) {
        console.error('❌ [JWT] Error verifying JWT:', e);
        return new Response(JSON.stringify({
          error: 'Token JWT inválido ou expirado'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (!cartorioId) {
      console.error('❌ [PERMISSIONS] cartorioId is null after token processing');
      return new Response(JSON.stringify({
        error: 'ID do cartório não encontrado no token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ [PERMISSIONS] Using cartorio_id:', cartorioId);
    
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
        console.error('Error fetching all systems:', systemsError);
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
    
    // Build the query based on what permissions exist
    let query = supabase
      .from('sistemas')
      .select(`
        *,
        produtos (
          *,
          video_aulas (*)
        )
      `);
    
    // Apply filters only if we have IDs to filter by
    if (systemIds.length > 0 && productIds.length > 0) {
      // Both system and product permissions exist
      query = query.or(`id.in.(${systemIds.join(',')}),produtos.id.in.(${productIds.join(',')})`);
    } else if (systemIds.length > 0) {
      // Only system permissions exist
      query = query.in('id', systemIds);
    } else if (productIds.length > 0) {
      // Only product permissions exist - we need systems that contain these products
      const { data: productsWithSystems, error: prodError } = await supabase
        .from('produtos')
        .select('sistema_id')
        .in('id', productIds);
      
      if (prodError) {
        console.error('Error fetching products for system lookup:', prodError);
        throw new Error('Erro ao processar permissões de produtos');
      }
      
      const systemIdsFromProducts = [...new Set(productsWithSystems?.map(p => p.sistema_id) || [])];
      
      if (systemIdsFromProducts.length > 0) {
        query = query.in('id', systemIdsFromProducts);
      } else {
        // No systems found for the given products
        return new Response(JSON.stringify({
          sistemas: [],
          hasPermissions: true,
          permissions: permissions
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // No valid permissions found
      return new Response(JSON.stringify({
        sistemas: [],
        hasPermissions: true,
        permissions: permissions
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    query = query.order('ordem', { ascending: true });
    
    const { data: allowedSystems, error: systemsError } = await query;
    
    if (systemsError) {
      console.error('Error fetching filtered systems:', systemsError);
      throw new Error('Erro ao carregar sistemas permitidos');
    }
    
    // Filter products within systems if we have specific product permissions
    const filteredSystems = allowedSystems?.map(system => {
      if (systemIds.includes(system.id)) {
        // System is fully allowed, return all products
        return system;
      } else if (productIds.length > 0) {
        // Only specific products are allowed
        const allowedProducts = system.produtos?.filter(product => 
          productIds.includes(product.id)
        ) || [];
        
        return {
          ...system,
          produtos: allowedProducts
        };
      }
      
      return system;
    }).filter(system => 
      // Keep systems that either have allowed products or are fully allowed
      systemIds.includes(system.id) || (system.produtos && system.produtos.length > 0)
    );
    
    console.log('Final filtered systems count:', filteredSystems?.length || 0);
    
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
