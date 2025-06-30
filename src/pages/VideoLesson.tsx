import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import VideoPlayer from '@/components/VideoPlayer';
import AIChat from '@/components/AIChat';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useBunnyVideoDetails } from '@/hooks/useBunnyVideoDetails';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

const VideoLesson: React.FC = () => {
  const { systemId, productId, videoId } = useParams();
  const navigate = useNavigate();
  
  const [videoAula, setVideoAula] = useState<VideoAula | null>(null);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [sistema, setSistema] = useState<Sistema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get video details from Bunny.net if bunny_video_id is available
  const { 
    videoDetails, 
    isLoading: isBunnyLoading, 
    error: bunnyError,
    fetchVideoDetails
  } = useBunnyVideoDetails();

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

        // Fetch Bunny video details if bunny_video_id exists
        if (videoData.id_video_bunny) {
          await fetchVideoDetails(videoData.id_video_bunny);
        } else {
          console.warn('No bunny_video_id found for this video aula:', videoData);
          toast({
            title: "ID da Bunny.net ausente",
            description: "Esta videoaula não tem um ID da Bunny.net configurado. O vídeo pode não carregar corretamente.",
            variant: "destructive",
          });
        }

      } catch (error) {
        console.error('Error in loadVideoLesson:', error);
        setError('Erro inesperado ao carregar a videoaula');
      } finally {
        setIsLoading(false);
      }
    };

    loadVideoLesson();
  }, [videoId, productId, systemId, fetchVideoDetails]);

  const handleBack = () => {
    navigate(`/system/${systemId}/product/${productId}`);
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
            { label: videoAula.titulo, href: '#' }
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
          <div className="lg:col-span-2">
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
            <Card className="mt-6 bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl text-white">
                  {videoAula.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {videoAula.descricao && (
                  <p className="text-gray-300 leading-relaxed">
                    {videoAula.descricao}
                  </p>
                )}
                
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <span>Ordem: {videoAula.ordem}</span>
                  {videoAula.id_video_bunny && (
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                      Bunny.net: {videoAula.id_video_bunny}
                    </span>
                  )}
                  {videoDuration && (
                    <span>Duração: {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toString().padStart(2, '0')}</span>
                  )}
                </div>

                {/* Show Bunny.net loading state */}
                {videoAula.id_video_bunny && isBunnyLoading && (
                  <Alert className="mt-4 border-blue-600 bg-blue-900/20">
                    <AlertDescription className="text-blue-300">
                      Carregando detalhes do vídeo da Bunny.net...
                    </AlertDescription>
                  </Alert>
                )}

                {/* Show Bunny.net error */}
                {videoAula.id_video_bunny && bunnyError && (
                  <Alert className="mt-4 border-red-600 bg-red-900/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-300">
                      Erro ao carregar detalhes da Bunny.net: {bunnyError}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
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
