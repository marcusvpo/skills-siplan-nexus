
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Play, Clock, BookOpen } from 'lucide-react';
import { useSistemas, useVisualizacoes, useFavoritos } from '@/hooks/useSupabaseData';
import ProgressDisplay from '@/components/ProgressDisplay';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: sistemas, isLoading: sistemasLoading } = useSistemas();
  const { data: visualizacoes } = useVisualizacoes();
  const { data: favoritos } = useFavoritos(user?.cartorio_id || '');

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      navigate('/login');
    }
  }, [user, navigate]);

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
      <div className="container mx-auto px-6 py-8 bg-black min-h-screen">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">
            Bem-vindo(a) ao Siplan Skills!
          </h1>
          {user.cartorio_name && (
            <p className="text-lg text-gray-300 mb-2">
              Você está acessando como usuário de: <span className="font-semibold text-white">{user.cartorio_name}</span>
            </p>
          )}
          <p className="text-gray-400">
            Continue seu aprendizado ou explore novos conteúdos sobre os sistemas Siplan.
          </p>
        </div>

        {/* Continue Learning Section */}
        {continueLearning.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center text-white">
              <Play className="h-6 w-6 mr-2 text-red-500" />
              Continuar Aprendendo
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {continueLearning.map((vis) => (
                <Card key={vis.id} className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">{vis.video_aulas?.titulo}</CardTitle>
                    <p className="text-sm text-gray-400">
                      {vis.video_aulas?.modulos?.produtos?.sistemas?.nome} • {vis.video_aulas?.modulos?.produtos?.nome}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4 text-sm">{vis.video_aulas?.descricao}</p>
                    <div className="space-y-3">
                      <ProgressDisplay
                        progressSegundos={vis.progresso_segundos}
                        duracaoSegundos={vis.video_aulas?.duracao_segundos || 0}
                        completo={vis.completo}
                        size="sm"
                      />
                      <Button className="w-full bg-red-600 hover:bg-red-700 transition-colors duration-200">
                        Continuar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Favorites Section */}
        {favoritos && favoritos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center text-white">
              <Star className="h-6 w-6 mr-2 text-yellow-500" />
              Meus Favoritos
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoritos.map((fav) => (
                <Card key={fav.id} className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-white">{fav.video_aulas?.titulo}</CardTitle>
                        <p className="text-sm text-gray-400">
                          {fav.video_aulas?.modulos?.produtos?.sistemas?.nome} • {fav.video_aulas?.modulos?.produtos?.nome}
                        </p>
                      </div>
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4 text-sm">{fav.video_aulas?.descricao}</p>
                    <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors duration-200">
                      Assistir Aula
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Recent History Section */}
        {recentHistory.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center text-white">
              <Clock className="h-6 w-6 mr-2 text-blue-500" />
              Histórico Recente
            </h2>
            <div className="space-y-3">
              {recentHistory.map((hist) => (
                <Card key={hist.id} className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{hist.video_aulas?.titulo}</h3>
                        <p className="text-sm text-gray-400">
                          {hist.video_aulas?.modulos?.produtos?.sistemas?.nome} • {hist.video_aulas?.modulos?.produtos?.nome}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Última visualização: {new Date(hist.ultima_visualizacao).toLocaleDateString('pt-BR')}
                        </p>
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
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
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

        {/* Systems Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-white">
            <BookOpen className="h-6 w-6 mr-2 text-green-500" />
            Nossos Sistemas
          </h2>
          
          {sistemasLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-gray-900 border-gray-700 animate-pulse">
                  <CardContent className="p-6 text-center">
                    <div className="h-16 w-16 bg-gray-700 rounded mx-auto mb-4"></div>
                    <div className="h-6 bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded mb-4"></div>
                    <div className="h-10 bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sistemas?.map((sistema) => {
                const progress = calculateSystemProgress(sistema);
                return (
                  <Card 
                    key={sistema.id} 
                    className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-300 cursor-pointer group hover:shadow-xl"
                    onClick={() => navigate(`/system/${sistema.id}`)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-4">{getSystemIcon(sistema.nome)}</div>
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-red-400 transition-colors text-white">
                        {sistema.nome}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        {sistema.descricao}
                      </p>
                      
                      {progress > 0 && (
                        <div className="mb-4">
                          <ProgressDisplay
                            progressSegundos={progress}
                            duracaoSegundos={100}
                            completo={progress === 100}
                            size="sm"
                          />
                        </div>
                      )}
                      
                      <Button 
                        className="w-full bg-red-600 hover:bg-red-700 group-hover:scale-105 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/system/${sistema.id}`);
                        }}
                      >
                        Acessar Treinamento
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
          {!sistemasLoading && (!sistemas || sistemas.length === 0) && (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Nenhum sistema disponível</h3>
                <p className="text-gray-500">
                  Os sistemas de treinamento serão disponibilizados em breve.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Dashboard;
