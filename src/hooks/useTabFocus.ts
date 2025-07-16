
import { useEffect } from 'react';
import { getValidSession } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useTabFocus = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // Usuário voltou para a aba - verificar sessão
        try {
          console.log('👁️ [useTabFocus] Usuário voltou para a aba, verificando sessão...');
          
          const validSession = await getValidSession();
          
          if (!validSession) {
            console.log('❌ [useTabFocus] Sessão inválida ou expirada, redirecionando para login');
            navigate('/login');
            return;
          }
          
          console.log('✅ [useTabFocus] Sessão válida confirmada');
        } catch (error) {
          console.error('❌ [useTabFocus] Erro inesperado ao verificar sessão:', error);
          navigate('/login');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate]);
};
