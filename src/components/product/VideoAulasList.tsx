import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, ArrowRight, Search, X, CheckCircle2, Video } from 'lucide-react';
import { useProgressoReativo } from '@/hooks/useProgressoReativo';
import { useProgressContext } from '@/contexts/ProgressContext';
import { useAuth } from '@/contexts/AuthContextFixed';
import { supabase } from '@/integrations/supabase/client';
import { BunnyThumbnail } from '@/components/admin/BunnyThumbnail';

// Helper para usar o contexto de progresso de forma segura
const useSafeProgressContext = () => {
  try {
    return useProgressContext();
  } catch {
    return { refreshKey: 0 };
  }
};

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  id_video_bunny?: string | null;
  url_thumbnail?: string | null;
}

interface VideoAulasListProps {
  videoAulas: VideoAula[];
  systemId: string;
  productId: string;
  headerAction?: React.ReactNode;
}

const VideoAulasList: React.FC<VideoAulasListProps> = ({ videoAulas, systemId, productId, headerAction }) => {

  console.log('🔵 [VideoAulasList] Componente renderizado:', {
    videoAulasCount: videoAulas.length,
    systemId,
    productId
  });

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  // Estado para controlar os vídeos completos
  const [videosCompletos, setVideosCompletos] = useState<Set<string>>(new Set());
  const [loadingProgress, setLoadingProgress] = useState(true);
  
  // Hook do progresso (apenas para trigger de updates)
  const { refreshKey } = useSafeProgressContext();

  // Buscar progresso das videoaulas
  const fetchProgress = React.useCallback(async () => {
    console.log('🔵 [VideoAulasList] fetchProgress chamado:', {
      hasUser: !!user,
      cartorioId: user?.cartorio_id,
      userId: user?.id,
      videoAulasCount: videoAulas.length
    });

    if (!user?.cartorio_id || !user?.id || videoAulas.length === 0) {
      console.log('⚠️ [VideoAulasList] Condições não atendidas para buscar progresso');
      setLoadingProgress(false);
      return;
    }

    try {
      setLoadingProgress(true);
      const videoIds = videoAulas.map(v => v.id);
      
      console.log('🔍 [VideoAulasList] Buscando progresso para vídeos:', videoIds);
      
      const { data: visualizacoes, error } = await supabase
        .from('user_video_progress')
        .select('video_aula_id')
        .eq('user_id', user.id)
        .eq('completed', true)
        .in('video_aula_id', videoIds);

      if (error) throw error;

      const completedSet = new Set(visualizacoes?.map(v => v.video_aula_id) || []);
      console.log('✅ [VideoAulasList] Progresso carregado:', {
        visualizacoes,
        completedVideoIds: Array.from(completedSet)
      });
      
      setVideosCompletos(completedSet);
    } catch (error) {
      console.error('❌ [VideoAulasList] Erro ao buscar progresso das videoaulas:', error);
    } finally {
      setLoadingProgress(false);
    }
  }, [user?.cartorio_id, user?.id, videoAulas]);

  // Atualizar progresso quando dados mudarem
  React.useEffect(() => {
    fetchProgress();
  }, [fetchProgress, refreshKey]);

  // Filtrar videoaulas com base no termo de pesquisa
  const filteredVideoAulas = useMemo(() => {
    if (!searchTerm.trim()) {
      return videoAulas;
    }

    return videoAulas.filter(aula =>
      aula.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (aula.descricao && aula.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [videoAulas, searchTerm]);

  const sortedVideoAulas = filteredVideoAulas.sort((a, b) => a.ordem - b.ordem);

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (videoAulas.length === 0) {
    return (
      <div className="space-y-6">
        {headerAction && <div className="flex flex-wrap items-center gap-3">{headerAction}</div>}
        <Card>
          <CardContent className="p-12 text-center">
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Video className="h-8 w-8" />
            </span>
            <h3 className="mb-2 text-xl font-semibold text-foreground">Nenhuma videoaula disponível</h3>
            <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
              As videoaulas para este produto serão disponibilizadas em breve.
            </p>
            <Button onClick={() => navigate(`/system/${systemId}`)} variant="outline">
              Voltar aos produtos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro de Pesquisa */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar videoaulas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-border/60 bg-card/60 pl-10 pr-10 backdrop-blur-md"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {searchTerm && (
          <Badge variant="outline">
            {filteredVideoAulas.length} resultado{filteredVideoAulas.length !== 1 ? 's' : ''}
          </Badge>
        )}
        {headerAction}
      </div>


      {/* Grade de Cards Compactos */}
      {sortedVideoAulas.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/30 text-muted-foreground">
              <Search className="h-6 w-6" />
            </span>
            <h3 className="mb-1 text-lg font-semibold text-foreground">Nenhuma videoaula encontrada</h3>
            <p className="text-sm text-muted-foreground">
              Tente outros termos ou limpe o filtro para ver todas as videoaulas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedVideoAulas.map((aula, index) => {
            const isCompleted = videosCompletos.has(aula.id);
            const goToLesson = () =>
              navigate(`/system/${systemId}/product/${productId}/lesson/${aula.id}`);

            return (
              <motion.div
                key={aula.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.35) }}
              >
                <Card
                  interactive
                  className={`group flex h-full cursor-pointer flex-col ${
                    isCompleted
                      ? 'border-success/60 shadow-lg shadow-success/20 hover:border-success'
                      : ''
                  }`}
                  onClick={goToLesson}
                >
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div className="relative -mx-4 -mt-4 aspect-video overflow-hidden rounded-t-xl bg-muted/20">
                      <BunnyThumbnail
                        videoId={aula.id_video_bunny}
                        fallbackUrl={aula.url_thumbnail}
                        alt={aula.titulo}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                      <span
                        className={`absolute bottom-2 left-2 flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-md transition-colors ${
                          isCompleted
                            ? 'bg-success/25 text-success'
                            : 'bg-background/60 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </span>
                      <span className="absolute bottom-2 right-2 rounded-md bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground backdrop-blur-md">
                        {String(aula.ordem).padStart(2, '0')}
                      </span>
                    </div>

                    <h3
                      className={`line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors ${
                        isCompleted ? 'group-hover:text-success' : 'group-hover:text-primary'
                      }`}
                    >
                      {aula.titulo}
                    </h3>

                    {isCompleted && (
                      <span className="flex w-fit items-center rounded-full border border-success/40 bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Concluída
                      </span>
                    )}

                    <Button
                      size="sm"
                      variant={isCompleted ? 'outline' : 'glow'}
                      className={`mt-auto w-full text-xs ${
                        isCompleted ? 'border-success/50 text-success hover:bg-success/10' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        goToLesson();
                      }}
                    >
                      {isCompleted ? 'Assistir novamente' : 'Assistir'}
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VideoAulasList;
