
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export const useSistemasCartorio = () => {
  const [sistemas, setSistemas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, authenticatedClient } = useAuth();

  const fetchSistemas = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🎯 [useSistemasCartorio] Starting fetch for user:', {
        userId: user?.id,
        cartorioId: user?.cartorio_id,
        userType: user?.type,
        hasAuthClient: !!authenticatedClient
      });

      if (!user?.cartorio_id || user.type !== 'cartorio') {
        throw new Error('Usuário não é do tipo cartório ou não possui cartorio_id');
      }

      if (!authenticatedClient) {
        throw new Error('Cliente autenticado não disponível');
      }

      console.log('🎯 [useSistemasCartorio] Calling get-sistemas-cartorio Edge Function...');

      // Usar POST com body em vez de GET com query params
      const { data, error } = await supabase.functions.invoke('get-sistemas-cartorio', {
        body: { cartorioId: user.cartorio_id }
      });

      console.log('🎯 [useSistemasCartorio] Edge Function response:', {
        data: data ? { success: data.success, dataLength: data.data?.length } : null,
        error: error ? { message: error.message, context: error.context } : null
      });

      if (error) {
        console.error('❌ [useSistemasCartorio] Edge Function error:', {
          error,
          message: error.message,
          context: error.context || 'No context available'
        });
        throw new Error(error.message || 'Erro ao buscar sistemas via Edge Function');
      }

      if (!data?.success) {
        console.error('❌ [useSistemasCartorio] API error:', data?.error);
        throw new Error(data?.error || 'Erro na resposta da Edge Function');
      }

      const sistemasData = data.data || [];
      console.log('✅ [useSistemasCartorio] Sistemas loaded successfully:', { 
        count: sistemasData.length,
        sistemas: sistemasData.map((s: any) => ({ 
          id: s.id, 
          nome: s.nome, 
          produtosCount: s.produtos?.length || 0 
        }))
      });

      setSistemas(sistemasData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [useSistemasCartorio] Error:', {
        error: err,
        message: errorMessage,
        userId: user?.id,
        cartorioId: user?.cartorio_id,
        stack: err instanceof Error ? err.stack : 'No stack available'
      });
      
      logger.error('[useSistemasCartorio] Failed to fetch sistemas', {
        error: errorMessage,
        userId: user?.id,
        cartorioId: user?.cartorio_id
      });
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.cartorio_id && user?.type === 'cartorio') {
      fetchSistemas();
    } else if (user && user.type !== 'cartorio') {
      console.log('🎯 [useSistemasCartorio] User is not cartorio type:', user.type);
      setError('Usuário não é do tipo cartório');
      setIsLoading(false);
    }
  }, [user?.cartorio_id, user?.type, authenticatedClient]);

  return {
    sistemas,
    isLoading,
    error,
    refetch: fetchSistemas
  };
};
