import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Star, Clock, CheckCircle } from 'lucide-react';
import { useSistemas, useVideoAulas, useVisualizacoes, useFavoritos } from '@/hooks/useSupabaseData';
import type { Database } from '@/types/database';

type VideoAula = Database['public']['Tables']['video_aulas']['Row'];
type VisualizacaoCartorio = Database['public']['Tables']['visualizacoes_cartorio']['Row'];
type Favorito = Database['public']['Tables']['favoritos_cartorio']['Row'];

const ModulePage = () => {
  const { systemId, productId, moduleId } = useParams<{
    systemId: string;
    productId: string;
    moduleId: string;
  }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: sistemas } = useSistemas();
  const { data: videoAulas } = useVideoAulas(moduleId);
  const { data: visualizacoes } = useVisualizacoes(user?.cartorio_id);
  const { data: favoritos } = useFavoritos(user?.cartorio_id || '');

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      navigate('/login');
    }
  }, [user, navigate]);

  const system = sistemas?.find(s => s.id === systemId);
  const product = system?.produtos?.find(p => p.id === productId);
  const module = product?.modulos?.find(m => m.id === moduleId);

  if (!system || !product || !module) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8 bg-black min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-400">Módulo não encontrado</h1>
          </div>
        </div>
      </Layout>
    );
  }

  const getVisualizacao = (aulaId: string): VisualizacaoCartorio | undefined => {
    if (!visualizacoes) return undefined;
    return visualizacoes.find(v => v.video_aula_id === aulaId);
  };

  const isFavorito = (aulaId: string): boolean => {
    if (!favoritos) return false;
    return favoritos.some(f => f.video_aula_id === aulaId);
  };

  const calculateModuleProgress = () => {
    if (!videoAulas || videoAulas.length === 0) return 0;

    const completedCount = videoAulas.filter(aula => {
      const vis = getVisualizacao(aula.id);
      return vis?.completo;
    }).length;

    return Math.round((completedCount / videoAulas.length) * 100);
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 bg-black min-h-screen">
        <Breadcrumbs
          items={[
            { label: system.nome, href: `/system/${systemId}` },
            { label: product.nome, href: `/system/${systemId}/product/${productId}` },
            { label: module.titulo },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">{module.titulo}</h1>
          <p className="text-gray-400 mb-4">{module.descricao}</p>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">Progresso do Módulo</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Progress value={calculateModuleProgress()} className="h-3" />
              </div>
              <span className="font-semibold text-lg text-white">{calculateModuleProgress()}%</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {videoAulas?.filter(a => getVisualizacao(a.id)?.completo).length || 0} de{' '}
              {videoAulas?.length || 0} aulas concluídas
            </p>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-semibold mb-6 text-white">Aulas do Módulo</h2>

          <div className="space-y-4">
            {videoAulas?.map(aula => {
              const visualizacao = getVisualizacao(aula.id);
              const favorito = isFavorito(aula.id);

              return (
                <Card
                  key={aula.id}
                  className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-300 cursor-pointer hover:shadow-lg"
                  onClick={() => navigate(`/system/${systemId}/product/${productId}/lesson/${aula.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="bg-red-600 rounded-full p-3 group-hover:scale-105 transition-transform">
                          <Play className="h-6 w-6 text-white" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{aula.titulo}</h3>
                            {visualizacao?.completo && (
                              <Badge variant="secondary" className="bg-green-600 text-green-100 border-0">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Concluída
                              </Badge>
                            )}
                            {favorito && <Star className="h-5 w-5 text-yellow-500 fill-current" />}
                          </div>

                          <p className="text-gray-400 text-sm mb-3">{aula.descricao}</p>

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {aula.duracao_segundos ? `${Math.floor(aula.duracao_segundos / 60)}min` : 'N/A'}
                            </div>
                            {visualizacao && (
                              <div className="flex items-center">
                                <div className="w-32">
                                  <Progress
                                    value={Math.round((visualizacao.progresso_segundos / (aula.duracao_segundos || 1)) * 100)}
                                    className="h-1"
                                  />
                                </div>
                                <span className="ml-2">
                                  {Math.round((visualizacao.progresso_segundos / (aula.duracao_segundos || 1)) * 100)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Button
                          className="bg-red-600 hover:bg-red-700 transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/system/${systemId}/product/${productId}/lesson/${aula.id}`);
                          }}
                        >
                          {visualizacao?.completo ? 'Revisar Aula' : 'Assistir Aula'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {(!videoAulas || videoAulas.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">Nenhuma aula encontrada para este módulo.</p>
              <p className="text-gray-500 text-sm mt-2">Novas aulas serão adicionadas em breve.</p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default ModulePage;
