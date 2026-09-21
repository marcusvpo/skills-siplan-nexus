import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthToken } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextFixed';
import { useSistemasCartorioWithAccess } from '@/hooks/useSistemasCartorioWithAccess';
import { getWebinarWindow, type WebinarWindow } from '@/lib/webinar';
import { logger } from '@/utils/logger';

const SUPABASE_URL = 'https://bnulocsnxiffavvabfdj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Qf2Fc0CgFvljfVhk3v9IYg_PrDm9z4J';

export interface WebinarVideo {
  id: string;
  titulo: string;
  descricao?: string | null;
  url_thumbnail?: string | null;
  id_video_bunny?: string | null;
  ordem: number;
  disponivel_em?: string | null;
  dias_disponibilidade?: number | null;
  disponivel_ate?: string | null;
  webinar_ativo?: boolean | null;
  window: WebinarWindow;
}

export interface WebinarTrack {
  id: string;
  nome: string;
  descricao?: string | null;
  sistemaId: string;
  sistemaNome: string;
  videos: WebinarVideo[];
}

/** Produtos de webinar liberados para o cartório, com a janela de prazo já calculada. */
export const useWebinars = () => {
  const { data: sistemas = [], isLoading, error, refetch } = useSistemasCartorioWithAccess();

  const tracks = useMemo<WebinarTrack[]>(() => {
    const result: WebinarTrack[] = [];

    (sistemas as any[]).forEach((sistema) => {
      (sistema.produtos || [])
        .filter((produto: any) => produto?.tipo === 'webinar')
        .forEach((produto: any) => {
          const videos: WebinarVideo[] = (produto.video_aulas || [])
            .map((aula: any) => ({ ...aula, window: getWebinarWindow(aula) }))
            .sort((a: WebinarVideo, b: WebinarVideo) => {
              const at = a.disponivel_em ? new Date(a.disponivel_em).getTime() : 0;
              const bt = b.disponivel_em ? new Date(b.disponivel_em).getTime() : 0;
              if (at !== bt) return bt - at;
              return (b.ordem || 0) - (a.ordem || 0);
            });

          result.push({
            id: produto.id,
            nome: produto.nome,
            descricao: produto.descricao,
            sistemaId: sistema.id,
            sistemaNome: sistema.nome,
            videos,
          });
        });
    });

    return result.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [sistemas]);

  const hasWebinars = tracks.some((t) => t.videos.length > 0);

  return { tracks, hasWebinars, isLoading, error, refetch };
};

/** Sistemas que NÃO são de webinar (usado na área de treinamentos). */
export const useSistemasTreinamento = () => {
  const query = useSistemasCartorioWithAccess();

  const sistemas = useMemo(
    () =>
      ((query.data || []) as any[])
        .map((sistema) => ({
          ...sistema,
          produtos: (sistema.produtos || []).filter((p: any) => p?.tipo !== 'webinar'),
        }))
        .filter((sistema) => (sistema.produtos || []).length > 0),
    [query.data]
  );

  return { ...query, data: sistemas };
};

interface WebinarVideoResponse {
  success: boolean;
  video: {
    id: string;
    titulo: string;
    descricao?: string | null;
    url_video: string;
    url_thumbnail?: string | null;
    id_video_bunny?: string | null;
    ordem: number;
  };
  produto: { id: string; nome: string; tipo: string } | null;
  sistema: { id: string; nome: string } | null;
  disponivel_em: string | null;
  disponivel_ate: string | null;
  server_time: string;
}

export class WebinarAccessError extends Error {
  code: string;
  disponivelAte: string | null;
  constructor(message: string, code: string, disponivelAte: string | null = null) {
    super(message);
    this.code = code;
    this.disponivelAte = disponivelAte;
  }
}

/** Pede a URL do webinar ao servidor. Só vem se o prazo estiver aberto. */
export const useWebinarVideo = (videoId?: string) => {
  const { user } = useAuth();

  return useQuery<WebinarVideoResponse>({
    queryKey: ['webinar-video', videoId, user?.cartorio_id],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new WebinarAccessError('Sessão não encontrada', 'UNAUTHORIZED');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-webinar-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
          'x-custom-auth': `Bearer ${token}`,
        },
        body: JSON.stringify({ video_aula_id: videoId }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        logger.warn('⚠️ [useWebinarVideo] Acesso negado', {
          status: response.status,
          code: payload?.error_code,
        });
        throw new WebinarAccessError(
          payload?.error || 'Não foi possível abrir este webinar',
          payload?.error_code || 'ERROR',
          payload?.disponivel_ate ?? null
        );
      }

      return payload as WebinarVideoResponse;
    },
    enabled: !!videoId && !!user?.cartorio_id,
    retry: false,
    staleTime: 60 * 1000,
  });
};
