import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VideoPlayer from '@/components/VideoPlayer';
import AIChat from '@/components/AIChat';
import { VideoProgressButton } from '@/components/VideoProgressButton';
import { useVideoAulaData } from '@/hooks/useSupabaseDataSimplified';
import { logger } from '@/utils/logger';

const VideoLesson: React.FC = () => {
  const { systemId, productId, videoId } = useParams<{ 
    systemId: string; 
    productId: string; 
    videoId: string; 
  }>();
  const navigate = useNavigate();
  
  const { data: videoAulaData, isLoading, error } = useVideoAulaData(videoId || '');

  useEffect(() => {
    if (videoId) {
      logger.info('🎥 [VideoLesson] Page loaded for video', { 
        videoId: videoId,
        systemId,
        productId 
      });
    }
  }, [videoId, systemId, productId]);

  // Verificação de token antes de carregar
  useEffect(() => {
    const token = localStorage.getItem('siplan-auth-token');
    if (!token) {
      logger.error('❌ [VideoLesson] Token de autenticação não encontrado - redirecionando para login');
      navigate('/login');
    }
  }, [navigate]);

  if (!videoId) {
    logger.error('❌ [VideoLesson] Missing video ID');
    return (
      <div className="min-h-screen flex items-center justify-center page-transition">
        <Card className="gradient-card shadow-elevated max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-400 mb-2 text-enhanced">ID da videoaula não encontrado</h3>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="bg-red-600 hover:bg-red-700 btn-hover-lift mt-4"
            >
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center page-transition">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-400 mx-auto mb-4" />
          <p className="text-white text-enhanced">Carregando videoaula...</p>
          <div className="loading-shimmer w-32 h-2 rounded-full mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  if (error || !videoAulaData) {
    logger.error('❌ [VideoLesson] Error or no data:', { error: error?.message });
    return (
      <div className="min-h-screen flex items-center justify-center page-transition">
        <Card className="gradient-card shadow-elevated max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-400 mb-2 text-enhanced">Erro ao carregar videoaula</h3>
            <p className="text-gray-400 mb-4">
              {error instanceof Error ? error.message : 'Videoaula não encontrada ou sem permissão de acesso'}
            </p>
            <div className="flex space-x-2 justify-center">
              <Button 
                onClick={() => navigate(productId ? `/system/${systemId}/product/${productId}` : '/dashboard')} 
                className="bg-red-600 hover:bg-red-700 btn-hover-lift"
              >
                Voltar
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50 btn-hover-lift"
              >
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { produtos: produto } = videoAulaData;
  const sistema = produto?.sistemas;

  logger.info('🎥 [VideoLesson] Data loaded successfully', {
    videoTitle: videoAulaData.titulo,
    productName: produto?.nome,
    systemName: sistema?.nome
  });

  return (
    <div className="min-h-screen text-white page-transition">
      {/* Enhanced Header */}
      <div className="border-b border-gray-700/50 glass-effect backdrop-blur-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(productId ? `/system/${systemId}/product/${productId}` : '/dashboard')}
                className="text-gray-300 hover:text-white hover:bg-gray-700/50 btn-hover-lift"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <p className="text-sm text-gray-400 mb-1">
                  {sistema?.nome} • {produto?.nome}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with enhanced layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="gradient-card rounded-xl overflow-hidden shadow-elevated card-enter">
              <VideoPlayer 
                videoUrl={videoAulaData.url_video}
                title={videoAulaData.titulo}
                thumbnailUrl={videoAulaData.url_thumbnail}
              />
            </div>
            
            {/* Video Title */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-white text-enhanced leading-tight">
                {videoAulaData.titulo}
              </h1>

              {/* Progress Button */}
              <div className="max-w-md">
                <VideoProgressButton 
                  videoAulaId={videoAulaData.id}
                  videoTitle={videoAulaData.titulo}
                  produtoId={productId}
                  onProgressChange={(videoId, completo) => {
                    console.log('🎥 [VideoLesson] Progresso atualizado:', { videoId, completo });
                    // O progresso será atualizado automaticamente pelo useProgressoReativo
                    // quando o usuário navegar de volta para a lista de produtos
                  }}
                />
              </div>
              
              {/* Video Description */}
              {videoAulaData.descricao && (
                <Card className="gradient-card shadow-modern border-gray-700/50 card-enter">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white text-xl text-enhanced">Sobre esta aula</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300 leading-relaxed text-lg">
                        {videoAulaData.descricao}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Enhanced AI Chat Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card className="gradient-card shadow-elevated border-gray-700/50 card-enter">
                <CardHeader className="border-b border-gray-700/50 pb-4">
                  <CardTitle className="text-white text-xl flex items-center text-enhanced">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg mr-3 shadow-modern">
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <span>Assistente IA</span>
                      <p className="text-sm font-normal text-gray-400 mt-1">
                        Tire suas dúvidas sobre esta aula
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[600px] overflow-hidden">
                    {videoAulaData.titulo?.includes("Orion PRO") || videoAulaData.titulo?.includes("Orion TN") ? (
                      <AIChat 
                        lessonTitle={videoAulaData.titulo} 
                        systemName={sistema?.nome}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center p-6">
                        <div className="text-center space-y-4">
                          <div className="p-4 bg-gray-800/50 rounded-lg mx-auto w-16 h-16 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-400 text-sm max-w-xs mx-auto">
                            Atualmente disponível apenas para os sistemas Orion TN e Orion PRO
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoLesson;
