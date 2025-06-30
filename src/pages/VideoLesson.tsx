
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import VideoPlayer from '@/components/VideoPlayer';
import AIChat from '@/components/AIChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, BookOpen, Play, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useSistemasCartorio } from '@/hooks/useSupabaseDataFixed';
import { useBunnyVideoDetails } from '@/hooks/useBunnyVideoDetails';
import ProgressDisplay from '@/components/ProgressDisplay';
import { logger } from '@/utils/logger';

interface BunnyVideoData {
  success: boolean;
  videoId: string;
  title: string;
  playUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  status: number;
  encodeProgress: number;
  isPublic: boolean;
  resolution: {
    width: number;
    height: number;
  };
  uploadDate: string;
  views: number;
  storageSize: number;
}

const VideoLesson = () => {
  const { systemId, productId, videoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bunnyVideoData, setBunnyVideoData] = useState<BunnyVideoData | null>(null);
  const [isLoadingBunnyData, setIsLoadingBunnyData] = useState(false);

  const { data: sistemas, isLoading, error } = useSistemasCartorio();
  const { fetchVideoDetails } = useBunnyVideoDetails();

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      logger.warn('📹 [VideoLesson] User not authenticated as cartorio, redirecting to login');
      navigate('/login');
    }
  }, [user, navigate]);

  // Find the current lesson data based on our actual data structure
  let currentVideoAula = null;
  let currentProduct = null;
  let currentSystem = null;
  
  if (sistemas && systemId && productId && videoId) {
    logger.info('📹 [VideoLesson] Searching for video aula', {
      systemId,
      productId,
      videoId,
      sistemasCount: sistemas.length
    });

    for (const system of sistemas) {
      if (system.id === systemId) {
        currentSystem = system;
        logger.info('📹 [VideoLesson] Found system:', { systemName: system.nome });
        
        for (const product of system.produtos || []) {
          if (product.id === productId) {
            currentProduct = product;
            logger.info('📹 [VideoLesson] Found product:', { productName: product.nome });
            
            for (const videoAula of product.video_aulas || []) {
              if (videoAula.id === videoId) {
                currentVideoAula = videoAula;
                logger.info('📹 [VideoLesson] Found video aula:', { videoAulaTitle: videoAula.titulo });
                break;
              }
            }
            if (currentVideoAula) break;
          }
        }
        if (currentVideoAula) break;
      }
    }
  }

  // Fetch Bunny.net video details when video aula is found
  useEffect(() => {
    const fetchBunnyVideoData = async () => {
      if (!currentVideoAula?.bunny_video_id) {
        logger.warn('📹 [VideoLesson] No bunny_video_id found for this video aula');
        return;
      }

      setIsLoadingBunnyData(true);
      logger.info('📹 [VideoLesson] Fetching Bunny.net data for video:', { bunnyVideoId: currentVideoAula.bunny_video_id });

      try {
        const bunnyData = await fetchVideoDetails(currentVideoAula.bunny_video_id);
        if (bunnyData) {
          setBunnyVideoData(bunnyData);
          logger.info('📹 [VideoLesson] Bunny.net data loaded successfully:', {
            title: bunnyData.title,
            hasPlayUrl: !!bunnyData.playUrl,
            hasThumbnailUrl: !!bunnyData.thumbnailUrl
          });
        }
      } catch (error) {
        logger.error('📹 [VideoLesson] Error fetching Bunny.net data:', error);
      } finally {
        setIsLoadingBunnyData(false);
      }
    };

    if (currentVideoAula) {
      fetchBunnyVideoData();
    }
  }, [currentVideoAula, fetchVideoDetails]);

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
          <Card className="bg-gray-800/50 border-gray-600 max-w-md">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-3" />
              <span className="text-white">Carregando videoaula...</span>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    logger.error('📹 [VideoLesson] Error loading data:', { error });
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
          <Card className="bg-gray-800/50 border-gray-600 max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-400 mb-4">Erro ao carregar dados</h1>
              <p className="text-gray-400 mb-6">Ocorreu um erro ao carregar os dados da videoaula.</p>
              <Button onClick={() => navigate('/dashboard')} className="bg-red-600 hover:bg-red-700">
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Not found state
  if (!currentSystem || !currentProduct || !currentVideoAula) {
    logger.warn('📹 [VideoLesson] Video aula not found:', {
      systemId,
      productId,
      videoId,
      foundSystem: !!currentSystem,
      foundProduct: !!currentProduct,
      foundVideoAula: !!currentVideoAula
    });

    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
          <Card className="bg-gray-800/50 border-gray-600 max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-400 mb-4">Aula não encontrada</h1>
              <p className="text-gray-400 mb-6">
                A aula solicitada não foi encontrada ou você não tem permissão para acessá-la.
              </p>
              <Button onClick={() => navigate('/dashboard')} className="bg-red-600 hover:bg-red-700">
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Get all video aulas in current product for navigation
  const productVideoAulas = currentProduct.video_aulas || [];
  const currentVideoIndex = productVideoAulas.findIndex(video => video.id === videoId);
  const previousVideo = currentVideoIndex > 0 ? productVideoAulas[currentVideoIndex - 1] : null;
  const nextVideo = currentVideoIndex < productVideoAulas.length - 1 ? productVideoAulas[currentVideoIndex + 1] : null;

  const toggleFavorite = () => {
    logger.info('📹 [VideoLesson] Toggle favorite for video:', { videoId });
    // TODO: Implement favorite functionality
  };

  const markAsComplete = async () => {
    if (!user?.cartorio_id) return;
    
    logger.info('📹 [VideoLesson] Marking video as complete:', { videoId });
    // TODO: Implement complete functionality
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-6 py-8">
          <Breadcrumbs items={[
            { label: currentSystem.nome, href: `/system/${systemId}` },
            { label: currentProduct.nome, href: `/system/${systemId}/product/${productId}` },
            { label: currentVideoAula.titulo }
          ]} />
          
          <div className="grid lg:grid-cols-3 gap-8 mt-6">
            {/* Main Video Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              <div className="glass-effect rounded-2xl overflow-hidden shadow-modern">
                {isLoadingBunnyData ? (
                  <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
                      <p className="text-gray-400">Carregando player de vídeo...</p>
                    </div>
                  </div>
                ) : (
                  <VideoPlayer 
                    videoUrl={bunnyVideoData?.playUrl || ''} 
                    title={bunnyVideoData?.title || currentVideoAula.titulo}
                    thumbnailUrl={bunnyVideoData?.thumbnailUrl}
                    duration={bunnyVideoData?.duration}
                  />
                )}
              </div>
              
              {/* Lesson Information */}
              <Card className="glass-effect border-gray-700">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <h1 className="text-3xl font-bold text-white">{currentVideoAula.titulo}</h1>
                        <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-0">
                          <Play className="h-3 w-3 mr-1" />
                          Videoaula
                        </Badge>
                      </div>
                      
                      {currentVideoAula.descricao && (
                        <p className="text-gray-300 text-lg leading-relaxed mb-6">
                          {currentVideoAula.descricao}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-8 text-gray-400">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 mr-2" />
                          <span className="text-lg">
                            {bunnyVideoData?.duration ? 
                              `${Math.floor(bunnyVideoData.duration / 60)}:${(bunnyVideoData.duration % 60).toString().padStart(2, '0')}` : 
                              'Vídeo disponível'
                            }
                          </span>
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="h-5 w-5 mr-2" />
                          <span className="text-lg">{currentProduct.nome}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={toggleFavorite}
                        className="text-gray-400 hover:text-yellow-500 transition-colors"
                      >
                        <Star className="h-8 w-8" />
                      </Button>
                      <Button
                        onClick={markAsComplete}
                        className="bg-green-600 hover:bg-green-700 px-6"
                      >
                        Marcar como Concluída
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progress Section */}
                  <div className="border-t border-gray-700 pt-6 mb-6">
                    <h3 className="text-xl font-semibold mb-4 text-white">Seu Progresso</h3>
                    <ProgressDisplay
                      progressSegundos={0} // This would come from user progress data
                      duracaoSegundos={bunnyVideoData?.duration || 0}
                      completo={false}
                      size="lg"
                    />
                  </div>
                  
                  {/* About Section */}
                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-xl font-semibold mb-3 text-white">Sobre esta aula</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Esta videoaula faz parte do produto <strong>{currentProduct.nome}</strong> 
                      do sistema <strong>{currentSystem.nome}</strong>. Aprenda as funcionalidades essenciais e melhores práticas 
                      para otimizar seu trabalho no cartório.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Between Videos */}
              <Card className="glass-effect border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {previousVideo ? (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/system/${systemId}/product/${productId}/lesson/${previousVideo.id}`)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Aula Anterior
                        </Button>
                      ) : (
                        <div></div>
                      )}
                    </div>
                    
                    <div className="flex-1 text-center">
                      <p className="text-gray-400 text-sm">
                        {currentVideoIndex + 1} de {productVideoAulas.length} aulas
                      </p>
                    </div>
                    
                    <div className="flex-1 text-right">
                      {nextVideo ? (
                        <Button
                          onClick={() => navigate(`/system/${systemId}/product/${productId}/lesson/${nextVideo.id}`)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Próxima Aula
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      ) : (
                        <div></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* AI Chat Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <AIChat lessonTitle={currentVideoAula.titulo} />
              </div>
            </div>
          </div>
          
          {/* Product Videos Navigation */}
          <div className="mt-12">
            <Card className="glass-effect border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-6 text-white flex items-center">
                  <BookOpen className="h-6 w-6 mr-3 text-blue-400" />
                  Outras aulas deste produto
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productVideoAulas.map((video, index) => (
                    <Card
                      key={video.id}
                      className={`cursor-pointer transition-all duration-300 ${
                        video.id === videoId 
                          ? 'bg-red-600/20 border-red-500' 
                          : 'bg-gray-800/50 border-gray-600 hover:border-red-500/50'
                      }`}
                      onClick={() => navigate(`/system/${systemId}/product/${productId}/lesson/${video.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${video.id === videoId ? 'bg-red-600' : 'bg-gray-600'}`}>
                            <Play className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm">{video.titulo}</h4>
                            <p className="text-xs text-gray-400 mt-1">
                              Aula {index + 1} • Disponível
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VideoLesson;
