
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Star, Play, Clock, BookOpen } from 'lucide-react';
import { systems, getUserProgress } from '@/data/mockData';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userProgress = getUserProgress();

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Bem-vindo(a), {user.name}!
          </h1>
          <p className="text-gray-400">
            Continue seu aprendizado ou explore novos conteúdos sobre os sistemas Siplan.
          </p>
        </div>

        {/* Continue Learning Section */}
        {userProgress.continueLearning.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Play className="h-6 w-6 mr-2 text-red-500" />
              Continuar Aprendendo
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProgress.continueLearning.map((lesson) => (
                <Card key={lesson.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                    <p className="text-sm text-gray-400">{lesson.systemName} • {lesson.productName}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4 text-sm">{lesson.description}</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progresso</span>
                          <span>{lesson.progress}%</span>
                        </div>
                        <Progress value={lesson.progress} className="h-2" />
                      </div>
                      <Button className="w-full bg-red-600 hover:bg-red-700">
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
        {userProgress.favorites.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Star className="h-6 w-6 mr-2 text-yellow-500" />
              Meus Favoritos
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProgress.favorites.map((lesson) => (
                <Card key={lesson.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{lesson.title}</CardTitle>
                        <p className="text-sm text-gray-400">{lesson.systemName} • {lesson.productName}</p>
                      </div>
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4 text-sm">{lesson.description}</p>
                    <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                      Assistir Aula
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Recent History Section */}
        {userProgress.recentHistory.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Clock className="h-6 w-6 mr-2 text-blue-500" />
              Histórico Recente
            </h2>
            <div className="space-y-3">
              {userProgress.recentHistory.map((lesson) => (
                <Card key={lesson.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{lesson.title}</h3>
                        <p className="text-sm text-gray-400">{lesson.systemName} • {lesson.productName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Última visualização: {lesson.lastViewed}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          lesson.status === 'Concluído' 
                            ? 'bg-green-600 text-green-100' 
                            : 'bg-yellow-600 text-yellow-100'
                        }`}>
                          {lesson.status}
                        </span>
                        <Button size="sm" variant="outline" className="border-gray-600">
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
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-green-500" />
            Nossos Sistemas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {systems.map((system) => (
              <Card 
                key={system.id} 
                className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all cursor-pointer group"
                onClick={() => navigate(`/system/${system.id}`)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{system.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-red-400 transition-colors">
                    {system.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {system.description}
                  </p>
                  <Button 
                    className="w-full bg-red-600 hover:bg-red-700 group-hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/system/${system.id}`);
                    }}
                  >
                    Explorar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Dashboard;
