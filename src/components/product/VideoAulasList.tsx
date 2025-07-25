import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Clock, ArrowRight, Search, X, CheckCircle } from 'lucide-react';
import { useProgressoReativo } from '@/hooks/useProgressoReativo';
import { useProgressContext } from '@/contexts/ProgressContext';
import { useAuth } from '@/contexts/AuthContextFixed';
import { supabase } from '@/integrations/supabase/client';

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
}

interface VideoAulasListProps {
  videoAulas: VideoAula[];
  systemId: string;
  productId: string;
}

const VideoAulasList: React.FC<VideoAulasListProps> = ({ videoAulas, systemId, productId }) => {
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
        .from('visualizacoes_cartorio')
        .select('video_aula_id')
        .eq('cartorio_id', user.cartorio_id)
        .eq('user_id', user.id)
        .eq('completo', true)
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
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-12 text-center">
          <div className="text-6xl mb-6">🎥</div>
          <h3 className="text-2xl font-semibold text-gray-300 mb-3">Nenhuma videoaula disponível</h3>
          <p className="text-gray-400 mb-6">
            As videoaulas para este produto serão disponibilizadas em breve.
          </p>
          <Button
            onClick={() => navigate(`/system/${systemId}`)}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Voltar aos Produtos
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro de Pesquisa */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Pesquisar videoaulas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-red-500"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-700"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Resultados da pesquisa */}
      {searchTerm && (
        <div className="text-sm text-gray-400">
          {filteredVideoAulas.length} videoaula(s) encontrada(s) para "{searchTerm}"
        </div>
      )}

      {/* Grade de Cards Compactos */}
      {sortedVideoAulas.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Nenhuma videoaula encontrada</h3>
          <p className="text-gray-400">
            Tente pesquisar com outros termos ou limpe o filtro para ver todas as videoaulas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedVideoAulas.map((aula) => {
            const isCompleted = videosCompletos.has(aula.id);

            return (
              <Card
                key={aula.id}
                className={`bg-gray-800/50 transition-all duration-300 cursor-pointer group ${
                  isCompleted
                    ? 'border-green-500/60 shadow-green-500/20 shadow-lg hover:border-green-400/80'
                    : 'border-gray-600 hover:border-red-500/50'
                }`}
                onClick={() => navigate(`/system/${systemId}/product/${productId}/lesson/${aula.id}`)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Ícone e Ordem */}
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg transition-colors ${
                        isCompleted
                          ? 'bg-green-600/20 group-hover:bg-green-600/30'
                          : 'bg-red-600/20 group-hover:bg-red-600/30'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Play className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {aula.ordem}
                      </div>
                    </div>

                    {/* Título */}
                    <div>
                      <h3 className={`font-semibold transition-colors text-sm line-clamp-2 leading-tight ${
                        isCompleted
                          ? 'text-green-100 group-hover:text-green-300'
                          : 'text-white group-hover:text-red-400'
                      }`}>
                        {aula.titulo}
                      </h3>
                    </div>

                     {/* Badge de Status e Botão */}
                     <div className="space-y-2">
                       {isCompleted && (
                         <div className="flex justify-center">
                           <div className="bg-green-600/90 text-green-50 px-2 py-1 rounded-full text-xs font-medium flex items-center shadow-lg">
                             <CheckCircle className="h-3 w-3 mr-1" />
                             Concluída
                           </div>
                         </div>
                       )}
                       
                       <Button
                         size="sm"
                         variant="outline"
                         className={`w-full text-xs transition-colors ${
                           isCompleted
                             ? 'border-green-600 text-green-300 hover:bg-green-600/20'
                             : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                         }`}
                         onClick={e => {
                           e.stopPropagation();
                           navigate(`/system/${systemId}/product/${productId}/lesson/${aula.id}`);
                         }}
                       >
                         {isCompleted ? 'Assistir Novamente' : 'Assistir'}
                         {isCompleted ? (
                           <CheckCircle className="h-3 w-3 ml-1" />
                         ) : (
                           <ArrowRight className="h-3 w-3 ml-1" />
                         )}
                       </Button>
                     </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VideoAulasList;
