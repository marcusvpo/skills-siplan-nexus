
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useTabFocus = () => {
  const { forceRefresh, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Só verificar se a aba ficou visível E se há um usuário autenticado
      if (!document.hidden && isAuthenticated) {
        console.log('👁️ [useTabFocus] Tab focus detectado com usuário autenticado, validando sessão...');
        
        try {
          // Usar o forceRefresh do contexto de auth que já tem toda a lógica de validação
          await forceRefresh();
          console.log('✅ [useTabFocus] Sessão revalidada com sucesso');
        } catch (error) {
          console.error('❌ [useTabFocus] Erro ao revalidar sessão:', error);
          // O forceRefresh já deve lidar com redirecionamento se necessário
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [forceRefresh, isAuthenticated]);
};
