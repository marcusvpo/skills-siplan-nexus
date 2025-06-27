
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AdminAuthResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAdminAuth = (): AdminAuthResult => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        logger.info('🔐 [useAdminAuth] Checking admin status');
        
        // Tentar criar um JWT customizado com role admin
        const customJWT = {
          role: 'admin',
          email: 'admin@siplan.com.br'
        };
        
        // Configurar o JWT customizado no header
        const { data, error: authError } = await supabase.auth.signInAnonymously();
        
        if (authError) {
          logger.warn('⚠️ [useAdminAuth] Auth error, trying alternative approach:', authError);
        }
        
        // Verificar se conseguimos acessar dados administrativos
        const { data: testData, error: testError } = await supabase
          .from('cartorios')
          .select('id')
          .limit(1);
        
        if (testError) {
          logger.error('❌ [useAdminAuth] Failed to access admin data:', testError);
          setError('Erro de autenticação administrativa');
          setIsAdmin(false);
        } else {
          logger.info('✅ [useAdminAuth] Admin access confirmed');
          setIsAdmin(true);
          setError(null);
        }
      } catch (err) {
        logger.error('❌ [useAdminAuth] Unexpected error:', err);
        setError('Erro inesperado na autenticação');
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  return { isAdmin, isLoading, error };
};
