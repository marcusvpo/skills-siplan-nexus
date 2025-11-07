import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import VideoPlayer from "@/components/VideoPlayer";
import { useAuth } from "@/hooks/useAuth";

export const TrilhaLessonPage = () => {
  const { video_aula_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: aulaData, isLoading } = useQuery({
    queryKey: ['trilha-aula', video_aula_id],
    queryFn: async () => {
      // Buscar dados da aula
      const { data: aula, error: aulaError } = await supabase
        .from('video_aulas')
        .select('*, produtos(nome)')
        .eq('id', video_aula_id)
        .single();
      
      if (aulaError) throw aulaError;

      // Buscar quiz da aula
      const { data: quiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('video_aula_id', video_aula_id)
        .eq('tipo', 'aula')
        .maybeSingle();

      return { aula, quiz };
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>;
  }

  if (!aulaData) {
    return <div className="p-8">Aula não encontrada.</div>;
  }

  const { aula, quiz } = aulaData;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{aula.titulo}</h1>
          <p className="text-muted-foreground">{aula.produtos?.nome}</p>
        </div>

        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <VideoPlayer
            videoUrl={aula.url_video}
            title={aula.titulo}
            thumbnailUrl={aula.url_thumbnail}
          />
        </div>

        {aula.descricao && (
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-2">Sobre esta aula</h2>
            <p className="text-muted-foreground">{aula.descricao}</p>
          </div>
        )}

        {quiz && (
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate(`/quiz/${quiz.id}`)}
            >
              Iniciar Quiz de Validação
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/trilha/inicio')}
            >
              Voltar para Trilha
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};