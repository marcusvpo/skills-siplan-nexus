
import { supabase } from '@/integrations/supabase/client';

export const debugRLSPolicies = async () => {
  console.log('🔍 [DEBUG] Starting RLS policy debugging...');
  
  try {
    // Test if we can access sistemas
    const { data: sistemas, error: sistemasError } = await supabase
      .from('sistemas')
      .select('*')
      .limit(5);
    
    console.log('🔍 [DEBUG] Sistemas query result:', { 
      count: sistemas?.length, 
      error: sistemasError?.message,
      data: sistemas 
    });
    
    // Test cartorio_acesso_conteudo access
    const { data: acessos, error: acessosError } = await supabase
      .from('cartorio_acesso_conteudo')
      .select('*')
      .limit(5);
    
    console.log('🔍 [DEBUG] Acessos query result:', { 
      count: acessos?.length, 
      error: acessosError?.message,
      data: acessos 
    });
    
    // Test current user context
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔍 [DEBUG] Current Supabase user:', user);
    
  } catch (error) {
    console.error('🔍 [DEBUG] Error during debugging:', error);
  }
};

export const debugUserPermissions = async (cartorioId: string) => {
  console.log('🔍 [DEBUG] Testing user permissions for cartorio:', cartorioId);
  
  try {
    // Test permission-based queries
    const { data: permissoes, error: permError } = await supabase
      .from('cartorio_acesso_conteudo')
      .select('*')
      .eq('cartorio_id', cartorioId)
      .eq('ativo', true);
    
    console.log('🔍 [DEBUG] Cartorio permissions:', { 
      cartorioId,
      permissoes: permissoes?.length || 0,
      error: permError?.message,
      data: permissoes
    });
    
    // Test sistemas query with RLS
    const { data: sistemasRLS, error: rlsError } = await supabase
      .from('sistemas')
      .select(`
        *,
        produtos (
          *,
          video_aulas (*)
        )
      `);
    
    console.log('🔍 [DEBUG] Sistemas with RLS:', { 
      count: sistemasRLS?.length,
      error: rlsError?.message,
      sistemas: sistemasRLS?.map(s => ({
        id: s.id,
        nome: s.nome,
        produtos: s.produtos?.length || 0
      }))
    });
    
  } catch (error) {
    console.error('🔍 [DEBUG] Error during permission debugging:', error);
  }
};

// Auto-run debug when imported (remove this in production)
if (typeof window !== 'undefined') {
  (window as any).debugRLS = debugRLSPolicies;
  (window as any).debugUserPermissions = debugUserPermissions;
}
