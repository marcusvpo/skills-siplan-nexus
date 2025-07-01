
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { useSistemasCartorioWithAccess } from '@/hooks/useSupabaseDataWithAccess';
import { logger } from '@/utils/logger';

const SystemPage = () => {
  const { systemId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: sistemas, isLoading, error } = useSistemasCartorioWithAccess();

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Find the current system
  const currentSystem = sistemas?.find(system => system.id === systemId);

  useEffect(() => {
    logger.info('🎯 [SystemPage] Page loaded', {
      systemId,
      sistemasCount: sistemas?.length,
      currentSystem: currentSystem ? { id: currentSystem.id, nome: currentSystem.nome } : null
    });
  }, [systemId, sistemas, currentSystem]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white">Carregando sistema...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    logger.error('❌ [SystemPage] Error loading system:', { error: error.message });
    return (
      <Layout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Card className="bg-gray-800/50 border-red-600 max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-400 mb-4">Erro ao carregar sistema</h1>
              <p className="text-gray-400 mb-6">{error.message}</p>
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
    logger.error('❌ [SystemPage] System not found:', { 
      systemId, 
      availableSystems: sistemas?.map(s => s.id) 
    });
    
    return (
      <Layout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Card className="bg-gray-800/50 border-red-600 max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-400 mb-4">Sistema não encontrado</h1>
              <p className="text-gray-400 mb-6">
                O sistema solicitado não foi encontrado ou você não tem permissão para acessá-lo.
              </p>
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
  logger.info('🎯 [SystemPage] Products found', { count: produtos.length });

  return (
    <Layout>
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-6 py-8">
          <Breadcrumbs items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: currentSystem.nome }
          ]} />
          
          <div className="mt-6 mb-8">
            <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-600">
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
                  const totalAulas = produto.video_aulas?.length || 0;
                  
                  return (
                    <Card 
                      key={produto.id} 
                      className="bg-gray-800/50 border-gray-600 hover:border-red-500/50 transition-all duration-300 cursor-pointer group hover:scale-105"
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
                            <span>{totalAulas} videoaula{totalAulas !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-red-600 hover:bg-red-700 transition-all duration-200 group-hover:scale-105"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/system/${systemId}/product/${produto.id}`);
                          }}
                        >
                          Acessar Produto
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-gray-800/50 border-gray-700">
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
