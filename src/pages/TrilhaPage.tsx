import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, PlayCircle, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const TrilhaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: trilhaData, isLoading } = useQuery({
    queryKey: ['trilha-usuario', (user as any)?.active_trilha_id],
    queryFn: async () => {
      if (!(user as any)?.active_trilha_id) return null;
      
      const { data: trilha, error } = await supabase
        .from('trilhas')
        .select(`
          *,
          produtos(nome, sistema_id, sistemas(nome)),
          trilha_aulas(*, video_aulas(id, titulo))
        `)
        .eq('id', (user as any).active_trilha_id)
        .single();
      
      if (error) throw error;
      
      // Buscar tentativas de quiz do usuário
      const { data: tentativas } = await supabase
        .from('user_quiz_tentativas')
        .select('quiz_id, aprovado')
        .eq('user_id', (user as any).id)
        .eq('aprovado', true);
      
      // Buscar quizzes das aulas
      const aulaIds = trilha.trilha_aulas.map((ta: any) => ta.video_aula_id);
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id, video_aula_id')
        .in('video_aula_id', aulaIds)
        .eq('tipo', 'aula');
      
      const quizAprovados = new Set(tentativas?.map(t => t.quiz_id) || []);
      const quizMap = new Map(quizzes?.map(q => [q.video_aula_id, q.id]) || []);
      
      return { trilha, quizAprovados, quizMap };
    },
    enabled: !!(user as any)?.active_trilha_id
  });

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando trilha...</div>;
  }

  if (!trilhaData) {
    return <div className="p-8">Nenhuma trilha ativa encontrada.</div>;
  }

  const { trilha, quizAprovados, quizMap } = trilhaData;
  const aulas = trilha.trilha_aulas.sort((a: any, b: any) => a.ordem - b.ordem);
  const totalAulas = aulas.length;
  const aulasCompletas = aulas.filter((a: any) => {
    const quizId = quizMap.get(a.video_aula_id);
    return quizId && quizAprovados.has(quizId);
  }).length;
  const progresso = (aulasCompletas / totalAulas) * 100;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{trilha.nome}</h1>
          <p className="text-muted-foreground">
            {trilha.produtos?.sistemas?.nome} → {trilha.produtos?.nome}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso da Trilha</span>
              <span className="text-sm text-muted-foreground">
                {aulasCompletas}/{totalAulas} aulas completas
              </span>
            </div>
            <Progress value={progresso} className="h-3" />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => navigate('/certificacoes')} variant="outline">
            <Award className="mr-2 h-4 w-4" />
            Ver Certificações
          </Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Roadmap de Aprendizagem</h2>
          {aulas.map((aulaItem: any, index: number) => {
            const quizId = quizMap.get(aulaItem.video_aula_id);
            const aulaCompleta = quizId && quizAprovados.has(quizId);
            const aulaAnteriorCompleta = index === 0 || (() => {
              const prevQuizId = quizMap.get(aulas[index - 1].video_aula_id);
              return prevQuizId && quizAprovados.has(prevQuizId);
            })();
            const aulaDesbloqueada = index === 0 || aulaAnteriorCompleta;

            return (
              <Card 
                key={aulaItem.id}
                className={`${aulaDesbloqueada ? 'cursor-pointer hover:border-primary' : 'opacity-50 cursor-not-allowed'}`}
                onClick={() => aulaDesbloqueada && navigate(`/trilha/aula/${aulaItem.video_aula_id}`)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-shrink-0">
                    {aulaCompleta ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    ) : aulaDesbloqueada ? (
                      <PlayCircle className="h-8 w-8 text-primary" />
                    ) : (
                      <Lock className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      Aula {index + 1}: {aulaItem.video_aulas?.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {aulaCompleta ? "Completa" : aulaDesbloqueada ? "Disponível" : "Bloqueada"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};