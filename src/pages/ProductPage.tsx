
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Play, Clock, CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { useSistemasFixed, useVisualizacoes } from '@/hooks/useSupabaseDataFixed';

const ProductPage = () => {
  const { systemId, productId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: sistemas } = useSistemasFixed();
  const { data: visualizacoes } = useVisualizacoes();

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Find the current system and product
  let currentSystem = null;
  let currentProduct = null;
  
  if (sistemas) {
    for (const system of sistemas) {
      if (system.id === systemId) {
        currentSystem = system;
        for (const product of system.produtos || []) {
          if (product.id === productId) {
            currentProduct = product;
            break;
          }
        }
        break;
      }
    }
  }

  if (!currentSystem || !currentProduct) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
          <Card className="glass-effect border-gray-700 max-w-md">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-red-400 mb-4">Produto não encontrado</h1>
              <p className="text-gray-400 mb-6">O produto solicitado não foi encontrado ou você não tem permissão para acessá-lo.</p>
              <Button onClick={() => navigate('/dashboard')} className="bg-red-600 hover:bg-red-700">
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const modulos = currentProduct.modulos || [];

  // Calculate progress
  let totalAulas = 0;
  let aulasCompletas = 0;
  
  modulos.forEach((modulo: any) => {
    modulo.video_aulas?.forEach((aula: any) => {
      totalAulas++;
      const visualizacao = visualizacoes?.find(v => v.video_aula_id === aula.id && v.completo);
      if (visualizacao) {
        aulasCompletas++;
      }
    });
  });
  
  const progress = totalAulas > 0 ? Math.round((aulasCompletas / totalAulas) * 100) : 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-6 py-8">
          <Breadcrumbs items={[
            { label: currentSystem.nome, href: `/system/${systemId}` },
            { label: currentProduct.nome }
          ]} />
          
          <div className="mt-6 mb-8">
            <div className="glass-effect rounded-2xl p-8 shadow-modern">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{currentProduct.nome}</h1>
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-0">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {currentSystem.nome}
                    </Badge>
                    <Badge variant="secondary" className="bg-green-600/20 text-green-300 border-0">
                      <Play className="h-3 w-3 mr-1" />
                      {totalAulas} videoaulas
                    </Badge>
                  </div>
                </div>
                
                {progress > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400 mb-1">{progress}%</div>
                    <div className="text-sm text-gray-400">Concluído</div>
                  </div>
                )}
              </div>
              
              {currentProduct.descricao && (
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  {currentProduct.descricao}
                </p>
              )}
              
              {progress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Progresso Geral</span>
                    <span>{aulasCompletas} de {totalAulas} aulas concluídas</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            {modulos.map((modulo: any) => {
              const videoAulas = modulo.video_aulas || [];
              const moduloCompletas = videoAulas.filter((aula: any) => 
                visualizacoes?.find(v => v.video_aula_id === aula.id && v.completo)
              ).length;
              const moduloProgress = videoAulas.length > 0 ? Math.round((moduloCompletas / videoAulas.length) * 100) : 0;
              
              return (
                <Card key={modulo.id} className="glass-effect border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl text-white mb-2">{modulo.titulo}</CardTitle>
                        {modulo.descricao && (
                          <p className="text-gray-400 text-sm">{modulo.descricao}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-400">{moduloCompletas}/{videoAulas.length}</div>
                          <div className="text-xs text-gray-500">aulas</div>
                        </div>
                        {moduloProgress > 0 && (
                          <div className="text-center">
                            <div className="text-lg font-semibold text-red-400">{moduloProgress}%</div>
                            <div className="text-xs text-gray-500">concluído</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {moduloProgress > 0 && (
                      <Progress value={moduloProgress} className="h-2 mt-3" />
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {videoAulas.map((aula: any) => {
                        const aulaCompleta = visualizacoes?.find(v => v.video_aula_id === aula.id && v.completo);
                        
                        return (
                          <Card 
                            key={aula.id} 
                            className="bg-gray-800/50 border-gray-600 hover:border-red-500/50 transition-all duration-300 cursor-pointer group"
                            onClick={() => navigate(`/system/${systemId}/product/${productId}/lesson/${aula.id}`)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 flex-1">
                                  <div className="p-2 bg-red-600/20 rounded-lg group-hover:bg-red-600/30 transition-colors">
                                    <Play className="h-5 w-5 text-red-400" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">
                                      {aula.titulo}
                                    </h3>
                                    {aula.descricao && (
                                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                        {aula.descricao}
                                      </p>
                                    )}
                                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                      <div className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {aula.duracao_segundos ? `${Math.floor(aula.duracao_segundos / 60)}min` : 'N/A'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  {aulaCompleta ? (
                                    <CheckCircle className="h-6 w-6 text-green-400" />
                                  ) : (
                                    <Circle className="h-6 w-6 text-gray-500" />
                                  )}
                                  <Button 
                                    size="sm" 
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/system/${systemId}/product/${productId}/lesson/${aula.id}`);
                                    }}
                                  >
                                    {aulaCompleta ? 'Revisar' : 'Assistir'}
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {modulos.length === 0 && (
            <Card className="glass-effect border-gray-700">
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-6">🎥</div>
                <h3 className="text-2xl font-semibold text-gray-300 mb-3">Nenhuma videoaula disponível</h3>
                <p className="text-gray-400 mb-6">
                  As videoaulas para este produto serão disponibilizadas em breve.
                </p>
                <Button 
                  onClick={() => navigate(`/system/${systemId}`)} 
                  variant="outline" 
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Voltar aos Produtos
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProductPage;
