
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, ArrowRight, Clock, Star } from 'lucide-react';
import { useSistemasCartorio } from '@/hooks/useSistemasCartorio';
import { useVisualizacoes } from '@/hooks/useSupabaseDataFixed';

const SystemPage = () => {
  const { systemId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { sistemas, isLoading, error } = useSistemasCartorio();
  const { data: visualizacoes } = useVisualizacoes();

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Find the current system
  const currentSystem = sistemas?.find(system => system.id === systemId);

  console.log('🎯 [SystemPage] Current state:', {
    systemId,
    sistemasCount: sistemas?.length,
    currentSystem: currentSystem ? { id: currentSystem.id, nome: currentSystem.nome } : null,
    isLoading,
    error
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white">Carregando sistema...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    console.error('🎯 [SystemPage] Error loading system:', error);
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
          <Card className="glass-effect border-gray-700 max-w-md">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-red-400 mb-4">Erro ao carregar sistema</h1>
              <p className="text-gray-400 mb-6">{error}</p>
              <Button onClick={() => navigate('/dashboard')} className="bg-red-600 hover:bg-red-700">
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!currentSystem) {
    console.error('🎯 [SystemPage] System not found:', { systemId, availableSystems: sistemas?.map(s => s.id) });
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
          <Card className="glass-effect border-gray-700 max-w-md">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-red-400 mb-4">Sistema não encontrado</h1>
              <p className="text-gray-400 mb-6">O sistema solicitado não foi encontrado ou você não tem permissão para acessá-lo.</p>
              <Button onClick={() => navigate('/dashboard')} className="bg-red-600 hover:bg-red-700">
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const produtos = currentSystem.produtos || [];

  // Calculate progress for each product
  const calculateProductProgress = (produto: any) => {
    if (!visualizacoes || !produto.video_aulas) return 0;
    
    const totalAulas = produto.video_aulas.length;
    let aulasCompletas = 0;
    
    produto.video_aulas.forEach((aula: any) => {
      const visualizacao = visualizacoes.find(v => v.video_aula_id === aula.id && v.completo);
      if (visualizacao) {
        aulasCompletas++;
      }
    });
    
    return totalAulas > 0 ? Math.round((aulasCompletas / totalAulas) * 100) : 0;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-6 py-8">
          <Breadcrumbs items={[
            { label: currentSystem.nome }
          ]} />
          
          <div className="mt-6 mb-8">
            <div className="glass-effect rounded-2xl p-8 shadow-modern">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {currentSystem.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{currentSystem.nome}</h1>
                  <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-0 mt-2">
                    <BookOpen className="h-3 w-3 mr-1" />
                    Sistema de Treinamento
                  </Badge>
                </div>
              </div>
              
              {currentSystem.descricao && (
                <p className="text-gray-300 text-lg leading-relaxed">
                  {currentSystem.descricao}
                </p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <BookOpen className="h-6 w-6 mr-3 text-blue-400" />
              Produtos de Treinamento
            </h2>
            
            {produtos.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {produtos.map((produto) => {
                  const progress = calculateProductProgress(produto);
                  const totalAulas = produto.video_aulas?.length || 0;
                  
                  return (
                    <Card 
                      key={produto.id} 
                      className="glass-effect border-gray-700 hover:border-red-500/50 transition-all duration-300 cursor-pointer group hover:shadow-modern hover:scale-105"
                      onClick={() => navigate(`/system/${systemId}/product/${produto.id}`)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xl text-white group-hover:text-red-400 transition-colors">
                          {produto.nome}
                        </CardTitle>
                        {produto.descricao && (
                          <p className="text-gray-400 text-sm leading-relaxed">
                            {produto.descricao}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{totalAulas} videoaulas</span>
                          </div>
                          {progress > 0 && (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 mr-1 text-yellow-500" />
                              <span>{progress}% concluído</span>
                            </div>
                          )}
                        </div>
                        
                        {progress > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Progresso</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        )}
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200 group-hover:scale-105"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/system/${systemId}/product/${produto.id}`);
                          }}
                        >
                          {progress > 0 ? 'Continuar' : 'Iniciar'} Treinamento
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="glass-effect border-gray-700">
                <CardContent className="p-12 text-center">
                  <div className="text-6xl mb-6">📚</div>
                  <h3 className="text-2xl font-semibold text-gray-300 mb-3">Nenhum produto disponível</h3>
                  <p className="text-gray-400 mb-6">
                    Os produtos de treinamento para este sistema serão disponibilizados em breve.
                  </p>
                  <Button 
                    onClick={() => navigate('/dashboard')} 
                    variant="outline" 
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Voltar ao Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SystemPage;
