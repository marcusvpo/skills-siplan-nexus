
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VideoPlayer from '@/components/VideoPlayer';
import AIChat from '@/components/AIChat';
import { ProgressButton } from '@/components/ProgressButton';
import { useVideoAulaData } from '@/hooks/useSupabaseDataSimplified';
import { logger } from '@/utils/logger';

const VideoLesson: React.FC = () => {
  const { systemId, productId, videoId } = useParams<{ 
    systemId: string; 
    productId: string; 
    videoId: string; 
  }>();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  
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

  if (!videoId) {
    logger.error('❌ [VideoLesson] Missing video ID');
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-red-600">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-400 mb-2">ID da videoaula não encontrado</h3>
            <Button onClick={() => navigate('/dashboard')} className="bg-red-600 hover:bg-red-700">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-400 mx-auto mb-4" />
          <p className="text-white">Carregando videoaula...</p>
        </div>
      </div>
    );
  }

  if (error || !videoAulaData) {
    logger.error('❌ [VideoLesson] Error or no data:', { error: error?.message });
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-red-600">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-400 mb-2">Erro ao carregar videoaula</h3>
            <p className="text-gray-400 mb-4">
              {error instanceof Error ? error.message : 'Videoaula não encontrada ou sem permissão de acesso'}
            </p>
            <div className="flex space-x-2 justify-center">
              <Button 
                onClick={() => navigate(productId ? `/system/${systemId}/product/${productId}` : '/dashboard')} 
                className="bg-red-600 hover:bg-red-700"
              >
                Voltar
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="border-gray-600 text-gray-300">
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

  const handleRating = (value: number) => {
    setRating(value);
    // Aqui você pode adicionar lógica para salvar a avaliação no backend
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(productId ? `/system/${systemId}/product/${productId}` : '/dashboard')}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <p className="text-sm text-gray-400">
                {sistema?.nome} • {produto?.nome}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="bg-gray-900/50 rounded-lg overflow-hidden backdrop-blur-sm">
              <VideoPlayer 
                videoUrl={videoAulaData.url_video}
                title={videoAulaData.titulo}
                thumbnailUrl={videoAulaData.url_thumbnail}
              />
            </div>
            
            {/* Video Title and Progress Button */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">{videoAulaData.titulo}</h1>
              <ProgressButton videoAulaId={videoId} />
            </div>

            {/* Description */}
            {videoAulaData.descricao && (
              <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    {videoAulaData.descricao}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Aula Anterior
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled
              >
                Próxima Aula
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Rating Component */}
            <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-lg">Avalie esta aula</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="text-2xl transition-colors duration-200 hover:scale-110 transform"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-gray-300 text-sm">
                      {rating} de 5 estrelas
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Chat */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-600 h-[700px] backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-lg">Assistente de IA</CardTitle>
                <p className="text-gray-400 text-sm">
                  Faça perguntas sobre esta videoaula
                </p>
              </CardHeader>
              <CardContent className="h-full p-0">
                <AIChat lessonTitle={videoAulaData.titulo} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoLesson;
