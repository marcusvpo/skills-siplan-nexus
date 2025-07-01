
import { supabase } from '@/integrations/supabase/client';

export const debugRLSPolicies = async () => {
  console.log('🔍 [DEBUG] Starting RLS policy debugging...');
  
  try {
    // Test if we can access sistemas
    const { data: sistemas, error: sistemasError } = await supabase
      .from('sistemas')
      .select('*')
      .limit(5);
    
    console.log('🔍 [DEBUG| Sistemas query result:', { 
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

// Call this function to debug RLS issues
// debugRLSPolicies();
