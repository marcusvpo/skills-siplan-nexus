import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, XCircle } from "lucide-react";

export const QuizPage = () => {
  const { video_aula_id, quiz_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [resultado, setResultado] = useState<any>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const tipo = searchParams.get('tipo');
  const finalQuizId = quiz_id || video_aula_id;

  const { data: quizData, isLoading } = useQuery({
    queryKey: ['quiz-page', finalQuizId],
    queryFn: async () => {
      const authToken = (user as any)?.token;
      if (!authToken) {
        console.error('[QuizPage] Token não encontrado');
        throw new Error('Token não encontrado');
      }

      const { data, error } = await supabase.functions.invoke('get-quiz-perguntas', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: { quiz_id: finalQuizId }
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!finalQuizId
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const authToken = (user as any)?.token;
      if (!authToken) {
        console.error('[QuizPage] Token não encontrado ao submeter quiz');
        throw new Error('Token não encontrado');
      }

      const respostasArray = Object.entries(respostas).map(([pergunta_id, resposta]) => ({
        pergunta_id,
        resposta: [resposta]
      }));

      const { data, error } = await supabase.functions.invoke('submit-quiz', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: {
          user_id: (user as any)?.id,
          quiz_id: finalQuizId,
          trilha_id: (user as any)?.active_trilha_id,
          respostas: respostasArray
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setResultado(data);
      if (data.aprovado) {
        toast({
          title: "Parabéns! 🎉",
          description: `Você acertou ${data.acertos} de ${data.total} questões!`
        });
      } else {
        toast({
          title: "Ops! 😔",
          description: `Você precisa de pelo menos ${quizData?.quiz.min_acertos} acertos. Tente novamente!`,
          variant: "destructive"
        });
      }
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando quiz...</div>;
  }

  if (resultado) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {resultado.aprovado ? (
                  <div className="flex flex-col items-center gap-4">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                    <span>Quiz Aprovado!</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <XCircle className="h-16 w-16 text-red-500" />
                    <span>Tente Novamente</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-2xl font-bold">
                {resultado.acertos} / {resultado.total}
              </p>
              <p className="text-muted-foreground">
                Score: {resultado.score.toFixed(0)}%
              </p>
              <div className="flex gap-4 justify-center">
                {resultado.aprovado ? (
                  <Button onClick={() => navigate(tipo ? '/certificacoes' : '/trilha/inicio')}>
                    Continuar
                  </Button>
                ) : (
                  <Button onClick={() => {
                    setResultado(null);
                    setRespostas({});
                  }}>
                    Tentar Novamente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{quizData?.quiz?.titulo}</h1>
          <p className="text-muted-foreground">
            Responda pelo menos {quizData?.quiz?.min_acertos} questões corretamente
          </p>
        </div>

        {quizData?.perguntas?.map((pergunta: any, index: number) => (
          <Card key={pergunta.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                Questão {index + 1}: {pergunta.pergunta}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pergunta.imagem_url && (
                <img
                  src={pergunta.imagem_url}
                  alt="Imagem da questão"
                  className="w-full max-h-64 object-contain mb-4 rounded"
                />
              )}
              <RadioGroup
                value={respostas[pergunta.id]?.toString()}
                onValueChange={(v) => setRespostas({ ...respostas, [pergunta.id]: parseInt(v) })}
              >
                {JSON.parse(pergunta.opcoes || "[]").map((opcao: any) => (
                  <div key={opcao.id} className="flex items-center space-x-2 p-2 rounded hover:bg-accent">
                    <RadioGroupItem value={opcao.id.toString()} id={`${pergunta.id}-${opcao.id}`} />
                    <Label htmlFor={`${pergunta.id}-${opcao.id}`} className="cursor-pointer flex-1">
                      {opcao.texto}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}

        <Button
          className="w-full"
          size="lg"
          onClick={() => submitMutation.mutate()}
          disabled={Object.keys(respostas).length !== quizData?.perguntas?.length}
        >
          Enviar Respostas
        </Button>
      </div>
    </div>
  );
};