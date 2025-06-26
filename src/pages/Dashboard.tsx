
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Play, Clock, BookOpen, ArrowRight, Trophy, TrendingUp } from 'lucide-react';
import { useSistemas, useVisualizacoes, useFavoritos } from '@/hooks/useSupabaseData';
import ProgressDisplay from '@/components/ProgressDisplay';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: sistemas, isLoading: sistemasLoading, error: sistemasError } = useSistemas();
  const { data: visualizacoes } = useVisualizacoes();
  const { data: favoritos } = useFavoritos(user?.cartorio_id || '');

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    console.log('Dashboard - User:', user);
    console.log('Dashboard - Sistemas loading:', sistemasLoading);
    console.log('Dashboard - Sistemas error:', sistemasError);
    console.log('Dashboard - Sistemas data:', sistemas);
  }, [user, sistemas, sistemasLoading, sistemasError]);

  if (!user) return null;

  // Process continue learning from visualizations
  const continueLearning = visualizacoes?.filter(v => !v.completo).slice(0, 3) || [];
  
  // Process recent history
  const recentHistory = visualizacoes?.slice(0, 5) || [];

  // Calculate overall progress
  const calculateSystemProgress = (sistema: any) => {
    if (!visualizacoes || !sistema.produtos) return 0;
    
    let totalAulas = 0;
    let aulasCompletas = 0;
    
    sistema.produtos.forEach((produto: any) => {
      produto.modulos?.forEach((modulo: any) => {
        modulo.video_aulas?.forEach((aula: any) => {
          totalAulas++;
          const visualizacao = visualizacoes.find(v => v.video_aula_id === aula.id);
          if (visualizacao?.completo) {
            aulasCompletas++;
          }
        });
      });
    });
    
    return totalAulas > 0 ? Math.round((aulasCompletas / totalAulas) * 100) : 0;
  };

  const getSystemIcon = (systemName: string) => {
    const iconMap: { [key: string]: string } = {
      'Orion': '🌟',
      'Siplan': '📋',
      'Control-M': '🎮',
      'Global': '🌍'
    };
    return iconMap[systemName] || '📚';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-6 py-8">
          {/* Enhanced Welcome Section */}
          <div className="mb-12 text-center">
            <div className="glass-effect rounded-2xl p-8 mb-8 shadow-modern">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                Bem-vindo ao Siplan Skills!
              </h1>
              {user.cartorio_name && (
                <div className="space-y-2">
                  <p className="text-xl text-white">
                    Olá, <span className="font-semibold text-red-400">{user.username || user.name}</span>!
                  </p>
                  <div className="inline-block px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-300">
                      Você está acessando como usuário de: <span className="font-semibold text-red-200">{user.cartorio_name}</span>
                    </p>
                  </div>
                </div>
              )}
              <p className="text-gray-300 mt-4 text-lg">
                Continue seu aprendizado ou explore novos conteúdos sobre os sistemas Siplan.
              </p>
            </div>
          </div>

          {/* Continue Learning Section */}
          {continueLearning.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-red-600 rounded-lg mr-3">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Continue de Onde Parou</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {continueLearning.map((vis) => (
                  <Card key={vis.id} className="glass-effect border-gray-700 hover:border-red-500/50 transition-all duration-300 group hover:shadow-modern">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-white group-hover:text-red-400 transition-colors">
                        {vis.video_aulas?.titulo}
                      </CardTitle>
                      <p className="text-sm text-gray-400">
                        {vis.video_aulas?.modulos?.produtos?.sistemas?.nome} • {vis.video_aulas?.modulos?.produtos?.nome}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-300 text-sm line-clamp-2">{vis.video_aulas?.descricao}</p>
                      <ProgressDisplay
                        progressSegundos={vis.progresso_segundos}
                        duracaoSegundos={vis.video_aulas?.duracao_segundos || 0}
                        completo={vis.completo}
                        size="sm"
                      />
                      <Button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200 group-hover:scale-105">
                        Continuar Assistindo
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Favorites Section */}
          {favoritos && favoritos.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-yellow-600 rounded-lg mr-3">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Meus Favoritos</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritos.slice(0, 6).map((fav) => (
                  <Card key={fav.id} className="glass-effect border-gray-700 hover:border-yellow-500/50 transition-all duration-300 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-white group-hover:text-yellow-400 transition-colors">
                            {fav.video_aulas?.titulo}
                          </CardTitle>
                          <p className="text-sm text-gray-400">
                            {fav.video_aulas?.modulos?.produtos?.sistemas?.nome} • {fav.video_aulas?.modulos?.produtos?.nome}
                          </p>
                        </div>
                        <Star className="h-5 w-5 text-yellow-500 fill-current flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-300 text-sm line-clamp-2">{fav.video_aulas?.descricao}</p>
                      <Button variant="outline" className="w-full border-yellow-600/50 text-yellow-300 hover:bg-yellow-600/10 transition-all duration-200">
                        Assistir Aula
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Main Systems Section */}
          <section>
            <div className="flex items-center mb-8">
              <div className="p-2 bg-blue-600 rounded-lg mr-3">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Meus Treinamentos</h2>
            </div>
            
            {sistemasLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="glass-effect border-gray-700 animate-pulse">
                    <CardContent className="p-8 text-center">
                      <div className="h-16 w-16 bg-gray-700 rounded-full mx-auto mb-4"></div>
                      <div className="h-6 bg-gray-700 rounded mb-3"></div>
                      <div className="h-4 bg-gray-700 rounded mb-4"></div>
                      <div className="h-2 bg-gray-700 rounded mb-4"></div>
                      <div className="h-10 bg-gray-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sistemasError ? (
              <Card className="glass-effect border-red-500/30">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold text-red-400 mb-2">Erro ao carregar sistemas</h3>
                  <p className="text-gray-400 mb-4">
                    Não foi possível carregar os sistemas de treinamento.
                  </p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Tentar Novamente
                  </Button>
                </CardContent>
              </Card>
            ) : sistemas && sistemas.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sistemas.map((sistema) => {
                  const progress = calculateSystemProgress(sistema);
                  return (
                    <Card 
                      key={sistema.id} 
                      className="glass-effect border-gray-700 hover:border-red-500/50 transition-all duration-300 cursor-pointer group hover:shadow-modern hover:scale-105"
                      onClick={() => navigate(`/system/${sistema.id}`)}
                    >
                      <CardContent className="p-8 text-center space-y-4">
                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                          {getSystemIcon(sistema.nome)}
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                          {sistema.nome}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {sistema.descricao}
                        </p>
                        
                        {progress > 0 && (
                          <div className="space-y-2">
                            <ProgressDisplay
                              progressSegundos={progress}
                              duracaoSegundos={100}
                              completo={progress === 100}
                              size="sm"
                            />
                            <div className="flex items-center justify-center text-xs text-gray-500">
                              <Trophy className="h-3 w-3 mr-1" />
                              {progress}% concluído
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200 group-hover:scale-105"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/system/${sistema.id}`);
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
                  <h3 className="text-2xl font-semibold text-gray-300 mb-3">Nenhum sistema disponível</h3>
                  <p className="text-gray-400 mb-6">
                    Os sistemas de treinamento serão disponibilizados em breve.
                  </p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline" 
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Atualizar Página
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Recent Activity Section */}
          {recentHistory.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-green-600 rounded-lg mr-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Atividade Recente</h2>
              </div>
              <div className="space-y-3">
                {recentHistory.slice(0, 3).map((hist) => (
                  <Card key={hist.id} className="glass-effect border-gray-700 hover:border-green-500/50 transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="p-2 bg-green-600/20 rounded-lg">
                            <Play className="h-4 w-4 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{hist.video_aulas?.titulo}</h3>
                            <p className="text-sm text-gray-400">
                              {hist.video_aulas?.modulos?.produtos?.sistemas?.nome} • {hist.video_aulas?.modulos?.produtos?.nome}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Última visualização: {new Date(hist.ultima_visualizacao).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-32">
                            <ProgressDisplay
                              progressSegundos={hist.progresso_segundos}
                              duracaoSegundos={hist.video_aulas?.duracao_segundos || 0}
                              completo={hist.completo}
                              size="sm"
                            />
                          </div>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Ver Aula
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
