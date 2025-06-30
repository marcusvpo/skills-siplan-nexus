
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toast } from '@/hooks/use-toast';

interface SearchResult {
  tipo: string;
  id: string;
  titulo: string;
  descricao?: string;
  similaridade: number;
}

export const useAdvancedSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const search = useCallback(async (termo: string, limite: number = 20) => {
    if (!termo.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      logger.info('🔍 [useAdvancedSearch] Iniciando busca avançada:', { termo, limite });

      // Primeira tentativa: usar a nova função de busca avançada
      try {
        const { data, error } = await supabase.rpc('busca_avancada_conteudo', {
          termo_busca: termo,
          limite: limite
        });

        if (error) {
          logger.warn('⚠️ [useAdvancedSearch] Função busca_avancada_conteudo não disponível:', error);
          throw new Error('Função não disponível');
        }

        logger.info('✅ [useAdvancedSearch] Busca avançada bem-sucedida:', { resultados: data?.length || 0 });
        setSearchResults(data || []);
        return;
      } catch (functionError) {
        logger.warn('⚠️ [useAdvancedSearch] Fallback para busca tradicional');
        
        // Fallback: busca tradicional
        const [sistemasResult, produtosResult, videoaulasResult] = await Promise.all([
          supabase
            .from('sistemas')
            .select('id, nome, descricao')
            .ilike('nome', `%${termo}%`)
            .limit(Math.ceil(limite / 3)),
          
          supabase
            .from('produtos')
            .select('id, nome, descricao')
            .ilike('nome', `%${termo}%`)
            .limit(Math.ceil(limite / 3)),
          
          supabase
            .from('video_aulas')
            .select('id, titulo, descricao')
            .ilike('titulo', `%${termo}%`)
            .limit(Math.ceil(limite / 3))
        ]);

        const results: SearchResult[] = [];

        if (sistemasResult.data) {
          results.push(...sistemasResult.data.map(item => ({
            tipo: 'sistema',
            id: item.id,
            titulo: item.nome,
            descricao: item.descricao,
            similaridade: 0.5 // Valor padrão para busca tradicional
          })));
        }

        if (produtosResult.data) {
          results.push(...produtosResult.data.map(item => ({
            tipo: 'produto',
            id: item.id,
            titulo: item.nome,
            descricao: item.descricao,
            similaridade: 0.5
          })));
        }

        if (videoaulasResult.data) {
          results.push(...videoaulasResult.data.map(item => ({
            tipo: 'video_aula',
            id: item.id,
            titulo: item.titulo,
            descricao: item.descricao,
            similaridade: 0.5
          })));
        }

        logger.info('✅ [useAdvancedSearch] Busca tradicional concluída:', { resultados: results.length });
        setSearchResults(results);
      }
    } catch (error) {
      logger.error('❌ [useAdvancedSearch] Erro na busca:', error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível realizar a busca. Tente novamente.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    search,
    clearSearch,
    isSearching,
    searchResults
  };
};
