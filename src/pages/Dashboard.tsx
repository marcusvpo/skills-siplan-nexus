
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Star, Play, Clock, BookOpen } from 'lucide-react';
import { useSistemas, useVisualizacoes, useFavoritos } from '@/hooks/useSupabaseData';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: sistemas, isLoading: sistemasLoading } = useSistemas();
  const { data: visualizacoes } = useVisualizacoes(user?.cartorio_id || '');
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
            Bem-vindo(a), {user.name}!
          </h1>
          <p className="text-gray-300">
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
                      <div>
                        <div className="flex justify-between text-sm mb-1 text-gray-300">
                          <span>Progresso</span>
                          <span>{Math.round((vis.progresso_segundos / (vis.video_aulas?.duracao_segundos || 1)) * 100)}%</span>
                        </div>
                        <Progress value={Math.round((vis.progresso_segundos / (vis.video_aulas?.duracao_segundos || 1)) * 100)} className="h-2" />
                      </div>
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
                        <span className={`px-2 py-1 rounded text-xs ${
                          hist.completo 
                            ? 'bg-green-600 text-green-100' 
                            : 'bg-yellow-600 text-yellow-100'
                        }`}>
                          {hist.completo ? 'Concluído' : 'Em Progresso'}
                        </span>
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
              {sistemas?.map((sistema) => (
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
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Dashboard;
