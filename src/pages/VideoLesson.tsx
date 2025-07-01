import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import VideoPlayer from '@/components/VideoPlayer';
import AIChat from '@/components/AIChat';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProgressDisplay from '@/components/ProgressDisplay';
import { ProgressTracker } from '@/components/ProgressTracker';
import { useBunnyVideoDetails } from '@/hooks/useBunnyVideoDetails';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny?: string;
  ordem: number;
  produto_id: string;
}

interface Produto {
  id: string;
  nome: string;
  sistema_id: string;
}

interface Sistema {
  id: string;
  nome: string;
}

interface Visualizacao {
  progresso_segundos: number;
  completo: boolean;
}

const VideoLesson: React.FC = () => {
  const { systemId, productId, videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [videoAula, setVideoAula] = useState<VideoAula | null>(null);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [sistema, setSistema] = useState<Sistema | null>(null);
  const [productVideoAulas, setProductVideoAulas] = useState<VideoAula[]>([]);
  const [visualizacao, setVisualizacao] = useState<Visualizacao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get video details from Bunny.net if bunny_video_id is available
  const { 
    videoDetails, 
    isLoading: isBunnyLoading, 
    error: bunnyError 
  } = useBunnyVideoDetails(videoAula?.id_video_bunny);

  useEffect(() => {
    const loadVideoLesson = async () => {
      if (!videoId || !productId || !systemId) {
        setError('Parâmetros de URL inválidos');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Load video aula details
        const { data: videoData, error: videoError } = await supabase
          .from('video_aulas')
          .select('*')
          .eq('id', videoId)
          .single();

        if (videoError) {
          console.error('Error loading video aula:', videoError);
          setError('Erro ao carregar videoaula');
          return;
        }

        if (!videoData) {
          setError('Videoaula não encontrada');
          return;
        }

        setVideoAula(videoData);

        // Load produto details
        const { data: produtoData, error: produtoError } = await supabase
          .from('produtos')
          .select('*')
          .eq('id', productId)
          .single();

        if (produtoError) {
          console.error('Error loading produto:', produtoError);
          setError('Erro ao carregar produto');
          return;
        }

        setProduto(produtoData);

        // Load sistema details
        const { data: sistemaData, error: sistemaError } = await supabase
          .from('sistemas')
          .select('*')
          .eq('id', systemId)
          .single();

        if (sistemaError) {
          console.error('Error loading sistema:', sistemaError);
          setError('Erro ao carregar sistema');
          return;
        }

        setSistema(sistemaData);

        // Load all video aulas for this product
        const { data: allVideoAulas, error: allVideoError } = await supabase
          .from('video_aulas')
          .select('*')
          .eq('produto_id', productId)
          .order('ordem', { ascending: true });

        if (allVideoError) {
          console.error('Error loading product video aulas:', allVideoError);
        } else {
          setProductVideoAulas(allVideoAulas || []);
        }

        // Load user progress if authenticated
        if (user?.cartorio_id) {
          const { data: progressData, error: progressError } = await supabase
            .from('visualizacoes_cartorio')
            .select('progresso_segundos, completo')
            .eq('video_aula_id', videoId)
            .eq('cartorio_id', user.cartorio_id)
            .single();

          if (progressError && progressError.code !== 'PGRST116') {
            console.error('Error loading progress:', progressError);
          } else if (progressData) {
            setVisualizacao(progressData);
          }
        }

      } catch (error) {
        console.error('Error in loadVideoLesson:', error);
        setError('Erro inesperado ao carregar a videoaula');
      } finally {
        setIsLoading(false);
      }
    };

    loadVideoLesson();
  }, [videoId, productId, systemId, user?.cartorio_id]);

  const handleBack = () => {
    navigate(`/system/${systemId}/product/${productId}`);
  };

  const handleProgressUpdate = (progress: { progressoSegundos: number; completo: boolean }) => {
    setVisualizacao(progress);
  };

  const currentVideoIndex = productVideoAulas.findIndex(v => v.id === videoId);
  const previousVideo = currentVideoIndex > 0 ? productVideoAulas[currentVideoIndex - 1] : null;
  const nextVideo = currentVideoIndex < productVideoAulas.length - 1 ? productVideoAulas[currentVideoIndex + 1] : null;

  const navigateToVideo = (video: VideoAula) => {
    navigate(`/system/${systemId}/product/${productId}/video/${video.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-6 w-96 bg-gray-800" />
          <Skeleton className="h-10 w-48 bg-gray-800" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video w-full bg-gray-800" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-8 w-3/4 bg-gray-800" />
                <Skeleton className="h-4 w-full bg-gray-800" />
                <Skeleton className="h-4 w-2/3 bg-gray-800" />
              </div>
            </div>
            <div>
              <Skeleton className="h-96 w-full bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="border-red-600 bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={handleBack} 
            className="mt-4 bg-gray-700 hover:bg-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (!videoAula || !produto || !sistema) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="border-yellow-600 bg-yellow-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-yellow-300">
              Dados incompletos carregados
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Determine video URL to use
  const videoUrl = videoDetails?.playUrl || videoAula.url_video || '';
  const thumbnailUrl = videoDetails?.thumbnailUrl;
  const videoDuration = videoDetails?.duration;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: sistema.nome, href: `/system/${sistema.id}` },
            { label: produto.nome, href: `/system/${sistema.id}/product/${produto.id}` },
            { label: videoAula.titulo }
          ]}
        />

        {/* Back Button */}
        <Button 
          onClick={handleBack}
          variant="outline"
          className="mb-6 border-gray-600 text-gray-300 hover:bg-gray-700/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Produto
        </Button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-0">
                {/* Show warning if no bunny_video_id */}
                {!videoAula.id_video_bunny && (
                  <Alert className="m-4 border-yellow-600 bg-yellow-900/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-yellow-300">
                      Esta videoaula não possui um ID da Bunny.net configurado. 
                      O vídeo pode não carregar corretamente.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Video Player */}
                <VideoPlayer
                  videoUrl={videoUrl}
                  title={videoAula.titulo}
                  thumbnailUrl={thumbnailUrl}
                  duration={videoDuration}
                />
              </CardContent>
            </Card>

            {/* Video Info */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl text-white">
                  {videoAula.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {videoAula.descricao && (
                  <p className="text-gray-300 leading-relaxed">
                    {videoAula.descricao}
                  </p>
                )}

                {/* Progress Display */}
                {visualizacao && videoDuration && (
                  <ProgressDisplay
                    progressSegundos={visualizacao.progresso_segundos}
                    duracaoSegundos={videoDuration}
                    completo={visualizacao.completo}
                    size="md"
                  />
                )}

                {/* Progress Tracker */}
                {user?.cartorio_id && (
                  <ProgressTracker
                    videoAulaId={videoAula.id}
                    progressoSegundos={visualizacao?.progresso_segundos || 0}
                    completo={visualizacao?.completo || false}
                    onProgressUpdate={handleProgressUpdate}
                  />
                )}

                {/* Show Bunny.net loading state */}
                {videoAula.id_video_bunny && isBunnyLoading && (
                  <Alert className="border-blue-600 bg-blue-900/20">
                    <AlertDescription className="text-blue-300">
                      Carregando detalhes do vídeo da Bunny.net...
                    </AlertDescription>
                  </Alert>
                )}

                {/* Show Bunny.net error */}
                {videoAula.id_video_bunny && bunnyError && (
                  <Alert className="border-red-600 bg-red-900/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-300">
                      Erro ao carregar detalhes da Bunny.net: {bunnyError}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                onClick={() => previousVideo && navigateToVideo(previousVideo)}
                disabled={!previousVideo}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Aula Anterior
              </Button>

              <Button
                onClick={() => nextVideo && navigateToVideo(nextVideo)}
                disabled={!nextVideo}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50 disabled:opacity-50"
              >
                Próxima Aula
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Other Videos in this Product */}
            {productVideoAulas.length > 1 && (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">
                    Outras aulas deste produto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {productVideoAulas.map((video, index) => (
                      <div
                        key={video.id}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          video.id === videoId
                            ? 'bg-red-600/20 border border-red-600/50'
                            : 'bg-gray-800/50 hover:bg-gray-700/50'
                        }`}
                        onClick={() => video.id !== videoId && navigateToVideo(video)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">
                            {index + 1}. {video.titulo}
                          </span>
                          {video.id === videoId && (
                            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                              Atual
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI Chat Section */}
          <div className="lg:col-span-1">
            <AIChat lessonTitle={videoAula.titulo} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoLesson;
