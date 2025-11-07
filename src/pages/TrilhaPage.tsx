import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, PlayCircle, Award, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const TrilhaPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // FLUXO B: Buscar dados da trilha via Edge Function dedicada
  const { data: roadmapData, isLoading, error } = useQuery({
    queryKey: ['active-trail-roadmap', (user as any)?.id],
    queryFn: async () => {
      console.log('[TrilhaPage] Buscando roadmap da trilha ativa...');
      
      const { data, error } = await supabase.functions.invoke('get-active-trail-roadmap', {
        headers: {
          'siplan-auth-token': localStorage.getItem('siplan-auth-token') || '',
        },
      });

      if (error) {
        console.error('[TrilhaPage] Erro ao buscar roadmap:', error);
        throw error;
      }

      console.log('[TrilhaPage] Roadmap recebido:', data);
      return data;
    },
    enabled: !!(user as any)?.id && !!(user as any)?.active_trilha_id,
  });

  // Handlers
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado",
        description: "Você saiu da plataforma com sucesso.",
      });
      navigate('/');
    } catch (error) {
      console.error('[TrilhaPage] Erro no logout:', error);
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar sair.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando seu roadmap de aprendizagem...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !roadmapData) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-destructive mb-2">Erro ao carregar trilha</h2>
              <p className="text-muted-foreground mb-4">
                {error?.message || 'Não foi possível carregar os dados da sua trilha de aprendizagem.'}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => navigate('/login')} variant="outline">
                  Voltar ao Login
                </Button>
                <Button onClick={handleLogout} variant="destructive">
                  Sair
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { trilha, sistema, produto, aulas } = roadmapData;
  const totalAulas = aulas.length;
  const aulasCompletas = aulas.filter((a: any) => a.status === 'concluido').length;
  const progresso = totalAulas > 0 ? (aulasCompletas / totalAulas) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/lovable-uploads/938cc4b0-f47e-4bb5-9eb9-1848eaade9af.png" 
              alt="Siplan Logo" 
              className="h-8"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">Siplan Skills</h1>
              <p className="text-xs text-muted-foreground">Trilha de Aprendizagem</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        {/* Trilha Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{trilha.nome}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="text-primary">{sistema.nome}</span>
            <span>→</span>
            <span>{produto.nome}</span>
          </p>
        </div>

        {/* Progress Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">Progresso da Trilha</span>
              <span className="text-sm text-muted-foreground">
                {aulasCompletas}/{totalAulas} aulas completas
              </span>
            </div>
            <Progress value={progresso} className="h-3" />
          </CardContent>
        </Card>

        {/* Certificações Button */}
        <div className="flex justify-end">
          <Button onClick={() => navigate('/certificacoes')} variant="outline">
            <Award className="mr-2 h-4 w-4" />
            Ver Certificações
          </Button>
        </div>

        {/* Roadmap Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Roadmap de Aprendizagem</h2>
          <p className="text-sm text-muted-foreground">
            Complete as aulas em sequência para desbloquear as próximas etapas da sua jornada.
          </p>
          
          {aulas.map((aula: any, index: number) => {
            const isClickable = aula.status === 'concluido' || aula.status === 'pendente';
            
            return (
              <Card 
                key={aula.id}
                className={`transition-all ${
                  isClickable 
                    ? 'cursor-pointer hover:border-primary hover:shadow-md' 
                    : 'opacity-60 cursor-not-allowed'
                } ${aula.status === 'concluido' ? 'border-green-500/30' : ''}`}
                onClick={() => isClickable && navigate(`/trilha/aula/${aula.id}`)}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex-shrink-0">
                    {aula.status === 'concluido' ? (
                      <div className="relative">
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-md"></div>
                      </div>
                    ) : aula.status === 'pendente' ? (
                      <div className="relative">
                        <PlayCircle className="h-10 w-10 text-primary" />
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse"></div>
                      </div>
                    ) : (
                      <Lock className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground">
                      Aula {index + 1}: {aula.titulo}
                    </h3>
                    {aula.descricao && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {aula.descricao}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {aula.status === 'concluido' && (
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                          ✓ Completa
                        </span>
                      )}
                      {aula.status === 'pendente' && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          ▶ Disponível
                        </span>
                      )}
                      {aula.status === 'bloqueado' && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                          🔒 Bloqueada
                        </span>
                      )}
                    </div>
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