import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';
import { logger } from '@/utils/logger';

export interface ContinuarAssistindoItem {
  videoAulaId: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  produtoId: string | null;
  produtoNome: string | null;
  sistemaId: string | null;
  sistemaNome: string | null;
  concluida: boolean;
  atualizadoEm: string | null;
}

/**
 * Última videoaula com registro de progresso do usuário — alimenta o
 * banner "Continuar de onde parou". Reaproveita as tabelas já existentes,
 * sem criar estruturas novas.
 */
export const useContinuarAssistindo = () => {
  const { user } = useAuth();

  return useQuery<ContinuarAssistindoItem | null>({
    queryKey: ['continuar-assistindo', user?.id],
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_video_progress')
        .select('video_aula_id, completed, created_at, completed_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        logger.error('[useContinuarAssistindo] erro ao buscar progresso:', error);
        throw error;
      }

      const ultimo = data?.find((registro) => !!registro.video_aula_id);
      if (!ultimo?.video_aula_id) return null;

      const { data: aula, error: aulaError } = await supabase
        .from('video_aulas')
        .select(`
          id,
          titulo,
          descricao,
          url_thumbnail,
          produto_id,
          produtos ( id, nome, sistema_id, sistemas ( id, nome ) )
        `)
        .eq('id', ultimo.video_aula_id)
        .maybeSingle();

      if (aulaError) {
        logger.error('[useContinuarAssistindo] erro ao buscar aula:', aulaError);
        throw aulaError;
      }
      if (!aula) return null;

      const produto = (aula as any).produtos ?? null;
      const sistema = produto?.sistemas ?? null;

      return {
        videoAulaId: aula.id,
        titulo: aula.titulo,
        descricao: aula.descricao,
        thumbnail: aula.url_thumbnail,
        produtoId: produto?.id ?? aula.produto_id ?? null,
        produtoNome: produto?.nome ?? null,
        sistemaId: sistema?.id ?? produto?.sistema_id ?? null,
        sistemaNome: sistema?.nome ?? null,
        concluida: !!ultimo.completed,
        atualizadoEm: ultimo.completed_at ?? ultimo.created_at ?? null,
      };
    },
  });
};
