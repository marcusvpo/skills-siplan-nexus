
import { useEffect } from 'react';
import { getValidSession } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useTabFocus = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('👁️ [useTabFocus] Tab focus detectado, validando sessão...');
        
        try {
          const validSession = await getValidSession();
          
          if (!validSession) {
            console.log('❌ [useTabFocus] Sessão inválida ou expirada');
            navigate('/login');
            return;
          }
          
          // Verificar se é realmente authenticated
          const jwtPayload = JSON.parse(atob(validSession.access_token.split('.')[1]));
          if (jwtPayload.role !== 'authenticated') {
            console.log('❌ [useTabFocus] Token não é authenticated:', jwtPayload.role);
            navigate('/login');
            return;
          }
          
          console.log('✅ [useTabFocus] Sessão válida confirmada');
        } catch (error) {
          console.error('❌ [useTabFocus] Erro ao validar sessão:', error);
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
