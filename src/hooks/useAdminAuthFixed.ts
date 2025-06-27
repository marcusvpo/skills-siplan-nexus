
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { User, Session } from '@supabase/supabase-js';

interface AdminAuthResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  session: Session | null;
  user: User | null;
}

export const useAdminAuth = (): AdminAuthResult => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAdminStatus = async (currentSession: Session | null = null) => {
      if (!mounted) return;

      try {
        logger.info('🔐 [useAdminAuth] Checking admin status', { 
          hasSession: !!currentSession,
          hasUser: !!currentSession?.user 
        });

        if (currentSession?.user) {
          // Verificar se é admin através do email na tabela admins
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('email', currentSession.user.email)
            .single();

          if (adminError && adminError.code !== 'PGRST116') {
            logger.error('❌ [useAdminAuth] Error checking admin status:', { error: adminError });
            throw new Error('Erro ao verificar permissões administrativas');
          }

          if (adminData) {
            logger.info('✅ [useAdminAuth] Admin access confirmed', { 
              email: currentSession.user.email,
              adminId: adminData.id 
            });
            setIsAdmin(true);
            setError(null);
          } else {
            logger.warn('⚠️ [useAdminAuth] User is not admin', { 
              email: currentSession.user.email 
            });
            setIsAdmin(false);
            setError('Usuário não possui permissões administrativas');
          }
        } else {
          // Sem sessão ativa
          logger.info('ℹ️ [useAdminAuth] No active session');
          setIsAdmin(false);
          setError(null);
        }
      } catch (err) {
        if (!mounted) return;
        
        logger.error('❌ [useAdminAuth] Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Erro inesperado na autenticação');
        setIsAdmin(false);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        logger.info('🔐 [useAdminAuth] Auth state changed:', { 
          event, 
          hasSession: !!session,
          email: session?.user?.email 
        });

        setSession(session);
        setUser(session?.user || null);
        setIsLoading(true);

        // Verificar status de admin sempre que a sessão mudar
        await checkAdminStatus(session);
      }
    );

    // Verificar sessão inicial
    const initializeAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (!mounted) return;

      setSession(initialSession);
      setUser(initialSession?.user || null);
      
      await checkAdminStatus(initialSession);
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, isLoading, error, session, user };
};
