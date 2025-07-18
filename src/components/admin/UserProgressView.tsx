import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
// Importa useAuth da versão FIXA
import { useAuth } from '@/contexts/AuthContextFixed'; 
import { toast } from '@/hooks/use-toast';

interface CartorioProgress {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  sistemas: {
    id: string;
    nome: string;
    produtos: {
      id: string;
      nome: string;
      total_aulas: number;
      aulas_concluidas: number;
      percentual: number;
    }[];
  }[];
}

export const UserProgressView: React.FC = () => {
  const { isAdmin } = useAuth();
  const [cartorios, setCartorios] = useState<CartorioProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCartorio, setSelectedCartorio] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadCartoriosProgress();
    }
  }, [isAdmin]);

  const loadCartoriosProgress = async () => {
    try {
      setIsLoading(true);

      // Buscar cartórios
      const { data: cartoriosData, error: cartoriosError } = await supabase
        .from('cartorios')
        .select('id, nome, cidade, estado')
        .eq('is_active', true)
        .order('nome');

      if (cartoriosError) throw cartoriosError;

      const cartoriosProgress: CartorioProgress[] = [];

      for (const cartorio of cartoriosData) {
        // Buscar sistemas e produtos
        const { data: sistemas, error: sistemasError } = await supabase
          .from('sistemas')
          .select(`
            id, nome,
            produtos (
              id, nome,
              video_aulas (id)
            )
          `)
          .order('ordem');

        if (sistemasError) throw sistemasError;

        const sistemasComProgresso = [];

        for (const sistema of sistemas) {
          const produtosComProgresso = [];

          for (const produto of sistema.produtos) {
            const totalAulas = produto.video_aulas.length;

            // Buscar aulas concluídas
            const { data: visualizacoes, error: visualError } = await supabase
              .from('visualizacoes_cartorio')
              .select('id')
              .eq('cartorio_id', cartorio.id)
              .eq('completo', true)
              .in('video_aula_id', produto.video_aulas.map(v => v.id));

            if (visualError) throw visualError;

            const aulasConcluidas = visualizacoes?.length || 0;
            const percentual = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;

            produtosComProgresso.push({
              id: produto.id,
              nome: produto.nome,
              total_aulas: totalAulas,
              aulas_concluidas: aulasConcluidas,
              percentual
            });
          }

          sistemasComProgresso.push({
            id: sistema.id,
            nome: sistema.nome,
            produtos: produtosComProgresso
          });
        }

        cartoriosProgress.push({
          id: cartorio.id,
          nome: cartorio.nome,
          cidade: cartorio.cidade,
          estado: cartorio.estado,
          sistemas: sistemasComProgresso
        });
      }

      setCartorios(cartoriosProgress);
    } catch (error) {
      console.error('❌ [UserProgressView] Erro ao carregar progresso:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar o progresso dos cartórios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOverallProgress = (cartorio: CartorioProgress) => {
    let totalAulas = 0;
    let totalConcluidas = 0;

    cartorio.sistemas.forEach(sistema => {
      sistema.produtos.forEach(produto => {
        totalAulas += produto.total_aulas;
        totalConcluidas += produto.aulas_concluidas;
      });
    });

    return {
      total: totalAulas,
      concluidas: totalConcluidas,
      percentual: totalAulas > 0 ? Math.round((totalConcluidas / totalAulas) * 100) : 0
    };
  };

  if (!isAdmin) {
    return (
      <Card className="gradient-card shadow-elevated border-gray-600/50">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">Acesso negado. Apenas administradores podem ver esta página.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="gradient-card shadow-elevated border-gray-600/50">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-white text-enhanced">Carregando progresso dos cartórios...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="gradient-card shadow-elevated border-gray-600/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-enhanced">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg mr-3 shadow-modern">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            Acompanhamento de Progresso por Cartório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {cartorios.map((cartorio) => {
              const overallProgress = getOverallProgress(cartorio);
              const isExpanded = selectedCartorio === cartorio.id;

              return (
                <Card 
                  key={cartorio.id} 
                  className="glass-effect border-gray-600/50 hover:border-blue-500/50 transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white text-enhanced">{cartorio.nome}</h3>
                        <p className="text-sm text-gray-400">
                          {cartorio.cidade}, {cartorio.estado}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">
                            {overallProgress.concluidas}/{overallProgress.total} aulas
                          </p>
                          <Badge variant={overallProgress.percentual >= 80 ? "default" : "secondary"}>
                            {overallProgress.percentual}% concluído
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCartorio(isExpanded ? null : cartorio.id)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                        >
                          {isExpanded ? 'Ocultar' : 'Detalhes'}
                        </Button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Progress value={overallProgress.percentual} className="h-2" />
                    </div>

                    {isExpanded && (
                      <div className="space-y-4 pt-4 border-t border-gray-600/50">
                        {cartorio.sistemas.map((sistema) => (
                          <div key={sistema.id} className="space-y-3">
                            <h4 className="font-medium text-white text-enhanced flex items-center">
                              <BookOpen className="h-4 w-4 mr-2 text-blue-400" />
                              {sistema.nome}
                            </h4>
                            <div className="grid gap-2 pl-6">
                              {sistema.produtos.map((produto) => (
                                <div key={produto.id} className="flex items-center justify-between p-3 glass-effect rounded-lg">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-white">{produto.nome}</p>
                                    <p className="text-xs text-gray-400">
                                      {produto.aulas_concluidas} de {produto.total_aulas} aulas concluídas
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-20">
                                      <Progress value={produto.percentual} className="h-1" />
                                    </div>
                                    <Badge 
                                      variant={produto.percentual === 100 ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {produto.percentual}%
                                    </Badge>
                                    {produto.percentual === 100 && (
                                      <CheckCircle className="h-4 w-4 text-green-400" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {cartorios.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum cartório encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};