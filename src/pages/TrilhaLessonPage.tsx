import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VideoPlayer from "@/components/VideoPlayer";
import { useAuth } from "@/hooks/useAuth";
import AIChat from "@/components/AIChat";
import Layout from "@/components/Layout";

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
    <Layout>
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna da Aula (Esquerda) */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white">{aula.titulo}</h1>
              <p className="text-muted-foreground">{aula.produtos?.nome}</p>
            </div>

            <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
              <VideoPlayer
                videoUrl={aula.url_video}
                title={aula.titulo}
                thumbnailUrl={aula.url_thumbnail}
              />
            </div>

            {aula.descricao && (
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Sobre esta aula</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none text-gray-300">
                  <p>{aula.descricao}</p>
                </CardContent>
              </Card>
            )}

            {quiz && (
              <Card className="bg-gray-800/50 border-primary/30">
                <CardContent className="pt-6 text-center space-y-4">
                  <h3 className="text-lg font-semibold text-white">Próximo Passo: Valide seu Conhecimento!</h3>
                  <p className="text-muted-foreground">
                    Ao finalizar esta videoaula, clique no botão abaixo para iniciar o quiz.
                    A aprovação é necessária para desbloquear a próxima aula da sua trilha.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => navigate(`/quiz/${quiz.id}?tipo=aula`)}
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna do Chatbot (Direita) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="gradient-card shadow-elevated border-gray-700/50">
                <CardHeader className="border-b border-gray-700/50 pb-4">
                  <CardTitle className="text-white text-xl flex items-center text-enhanced">
                    <svg className="h-5 w-5 mr-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Assistente IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[600px] overflow-hidden">
                    <AIChat 
                      lessonTitle={aula.titulo} 
                      systemName={aula.produtos?.nome}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};