
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';
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

      console.log('🎯 [useSistemasCartorio] Fetching sistemas for user:', {
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

      // Usar a Edge Function para buscar sistemas com permissões
      const { data, error } = await supabase.functions.invoke('get-sistemas-cartorio', {
        body: { cartorioId: user.cartorio_id }
      });

      if (error) {
        console.error('❌ [useSistemasCartorio] Edge Function error:', error);
        throw new Error(error.message || 'Erro ao buscar sistemas via Edge Function');
      }

      if (!data?.success) {
        console.error('❌ [useSistemasCartorio] API error:', data?.error);
        throw new Error(data?.error || 'Erro na resposta da Edge Function');
      }

      console.log('✅ [useSistemasCartorio] Sistemas loaded:', { 
        count: data.data?.length || 0,
        sistemas: data.data?.map((s: any) => ({ id: s.id, nome: s.nome })) || []
      });

      setSistemas(data.data || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [useSistemasCartorio] Error:', {
        error: err,
        message: errorMessage,
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
