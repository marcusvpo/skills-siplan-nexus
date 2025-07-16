
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useTabFocus = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // Usuário voltou para a aba - verificar sessão
        try {
          console.log('👁️ [useTabFocus] Usuário voltou para a aba, verificando sessão...');
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ [useTabFocus] Erro ao verificar sessão:', error);
            return;
          }
          
          if (!session) {
            console.log('❌ [useTabFocus] Sessão expirou, redirecionando para login');
            navigate('/login');
            return;
          }
          
          // Verificar se a sessão ainda é válida (não expirou)
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = session.expires_at || 0;
          
          if (expiresAt <= now) {
            console.log('❌ [useTabFocus] Sessão expirou, redirecionando para login');
            await supabase.auth.signOut();
            navigate('/login');
            return;
          }
          
          console.log('✅ [useTabFocus] Sessão válida');
        } catch (error) {
          console.error('❌ [useTabFocus] Erro inesperado ao verificar sessão:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate]);
};
