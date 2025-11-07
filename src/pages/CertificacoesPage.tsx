import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const CertificacoesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: certStatus, isLoading, error } = useQuery({
    queryKey: ['certification-status', (user as any)?.id, (user as any)?.active_trilha_id],
    queryFn: async () => {
      if (!(user as any)?.id || !(user as any)?.active_trilha_id || !(user as any)?.token) {
        throw new Error('Dados de autenticação incompletos');
      }
      
      const authToken = (user as any).token;
      
      const { data, error } = await supabase.functions.invoke('get-certification-status', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: { user_id: (user as any).id, trilha_id: (user as any).active_trilha_id }
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!(user as any)?.id && !!(user as any)?.active_trilha_id && !!(user as any)?.token
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando status das certificações...</p>
        </div>
      </div>
    );
  }

  if (error || !certStatus) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-destructive mb-2">Erro ao carregar certificações</h2>
              <p className="text-muted-foreground mb-4">
                {error?.message || 'Não foi possível carregar o status das suas certificações.'}
              </p>
              <Button onClick={() => navigate('/trilha/inicio')} variant="outline">
                Voltar para Trilha
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const certificates = [
    {
      nivel: "Bronze",
      icon: "🥉",
      color: "border-amber-600",
      bgColor: "bg-amber-50",
      unlocked: certStatus.bronze_unlocked,
      aprovado: certStatus.bronze_aprovado,
      quiz_id: certStatus.bronze_quiz_id,
      descricao: "Complete a trilha para desbloquear"
    },
    {
      nivel: "Prata",
      icon: "🥈",
      color: "border-gray-400",
      bgColor: "bg-gray-50",
      unlocked: certStatus.prata_unlocked,
      aprovado: certStatus.prata_aprovado,
      quiz_id: certStatus.prata_quiz_id,
      descricao: "Aprovação no Bronze necessária"
    },
    {
      nivel: "Ouro",
      icon: "🥇",
      color: "border-yellow-500",
      bgColor: "bg-yellow-50",
      unlocked: certStatus.ouro_unlocked,
      aprovado: false,
      descricao: "Aprovação na Prata necessária"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Certificações</h1>
          <p className="text-muted-foreground">
            Complete os quizzes para obter suas certificações
          </p>
        </div>

        {!certStatus.trilhaCompleta && (
          <Card className="border-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-center text-blue-900">
                Complete todas as aulas da trilha para desbloquear as certificações
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card
              key={cert.nivel}
              className={`${cert.color} ${!cert.unlocked && 'opacity-50'}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-4xl">{cert.icon}</span>
                    {cert.nivel}
                  </span>
                  {cert.aprovado && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                  {!cert.unlocked && <Lock className="h-6 w-6 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{cert.descricao}</p>
                
                {cert.aprovado && (
                  <div className="p-4 bg-green-50 rounded border border-green-200">
                    <p className="text-green-800 font-semibold text-center">✓ Certificado Obtido</p>
                  </div>
                )}

                {cert.unlocked && !cert.aprovado && cert.quiz_id && (
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/quiz/${cert.quiz_id}?tipo=${cert.nivel.toLowerCase()}`)}
                  >
                    Iniciar Quiz {cert.nivel}
                  </Button>
                )}

                {cert.nivel === "Ouro" && cert.unlocked && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-center">Prova Final Presencial</p>
                    <Button className="w-full" variant="outline">
                      <Award className="mr-2 h-4 w-4" />
                      Agendar Prova
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => navigate('/trilha/inicio')}>
            Voltar para Trilha
          </Button>
        </div>
      </div>
    </div>
  );
};