
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const useSupabaseWithLogging = () => {
  const queryWithLogging = useCallback(async (
    table: string,
    operation: string,
    queryFn: () => Promise<any>
  ) => {
    const startTime = performance.now();
    logger.debug(`Supabase Query Started: ${operation} on ${table}`);
    
    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;
      
      if (result.error) {
        logger.error(`Supabase Query Error: ${operation} on ${table}`, {
          error: result.error,
          duration: Math.round(duration)
        });
      } else {
        logger.debug(`Supabase Query Success: ${operation} on ${table}`, {
          recordCount: Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0),
          duration: Math.round(duration)
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Supabase Query Exception: ${operation} on ${table}`, {
        error,
        duration: Math.round(duration)
      });
      throw error;
    }
  }, []);

  const fetchSistemas = useCallback(() => {
    return queryWithLogging('sistemas', 'SELECT all', async () =>
      await supabase
        .from('sistemas')
        .select('id, nome, descricao, ordem')
        .order('ordem')
    );
  }, [queryWithLogging]);

  const fetchProdutos = useCallback((sistemaId: string) => {
    return queryWithLogging('produtos', `SELECT by sistema_id: ${sistemaId}`, async () =>
      await supabase
        .from('produtos')
        .select('id, nome, descricao, ordem, sistema_id')
        .eq('sistema_id', sistemaId)
        .order('ordem')
    );
  }, [queryWithLogging]);

  const fetchVideoAulas = useCallback((produtoId: string) => {
    return queryWithLogging('video_aulas', `SELECT by produto_id: ${produtoId}`, async () =>
      await supabase
        .from('video_aulas')
        .select('id, titulo, descricao, url_video, url_thumbnail, ordem, produto_id')
        .eq('produto_id', produtoId)
        .order('ordem')
    );
  }, [queryWithLogging]);

  const fetchCartorios = useCallback(() => {
    return queryWithLogging('cartorios', 'SELECT all with acessos', async () =>
      await supabase
        .from('cartorios')
        .select(`
          *,
          acessos_cartorio!acessos_cartorio_fk (*)
        `)
        .order('nome')
    );
  }, [queryWithLogging]);

  const fetchVideoAulaById = useCallback((id: string) => {
    return queryWithLogging('video_aulas', `SELECT by id: ${id}`, async () =>
      await supabase
        .from('video_aulas')
        .select('*')
        .eq('id', id)
        .single()
    );
  }, [queryWithLogging]);

  const fetchProdutoById = useCallback((id: string) => {
    return queryWithLogging('produtos', `SELECT by id: ${id}`, async () =>
      await supabase
        .from('produtos')
        .select('*')
        .eq('id', id)
        .single()
    );
  }, [queryWithLogging]);

  const fetchSistemaById = useCallback((id: string) => {
    return queryWithLogging('sistemas', `SELECT by id: ${id}`, async () =>
      await supabase
        .from('sistemas')
        .select('*')
        .eq('id', id)
        .single()
    );
  }, [queryWithLogging]);

  return {
    queryWithLogging,
    fetchSistemas,
    fetchProdutos,
    fetchVideoAulas,
    fetchCartorios,
    fetchVideoAulaById,
    fetchProdutoById,
    fetchSistemaById
  };
};
