
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { useSistemasCartorioWithAccess } from '@/hooks/useSupabaseDataWithAccess';
import { logger } from '@/utils/logger';

const ProductPage = () => {
  const { systemId, productId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Now using the RLS-enabled hook that automatically filters content
  const { data: sistemas, isLoading, error } = useSistemasCartorioWithAccess();

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    logger.info('🎯 [ProductPage] Page loaded', { 
      systemId, 
      productId, 
      sistemasCount: sistemas?.length 
    });
  }, [systemId, productId, sistemas]);

  // Find the current system and product - RLS will ensure we only see allowed content
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

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white">Carregando produto...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !currentSystem || !currentProduct) {
    logger.error('❌ [ProductPage] Error or not found', { 
      error, 
      currentSystem: !!currentSystem, 
      currentProduct: !!currentProduct 
    });
    
    return (
      <Layout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Card className="bg-gray-800/50 border-red-600 max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-400 mb-4">Produto não encontrado</h1>
              <p className="text-gray-400 mb-6">
                O produto solicitado não foi encontrado ou você não tem permissão para acessá-lo.
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

  const videoAulas = currentProduct.video_aulas || [];
  logger.info('🎯 [ProductPage] Video aulas found', { count: videoAulas.length });

  return (
    <Layout>
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-6 py-8">
          <Breadcrumbs items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: currentSystem.nome, href: `/system/${systemId}` },
            { label: currentProduct.nome }
          ]} />
          
          <div className="mt-6 mb-8">
            <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-600">
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
                      {videoAulas.length} videoaula{videoAulas.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {currentProduct.descricao && (
                <p className="text-gray-300 text-lg leading-relaxed">
                  {currentProduct.descricao}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Videoaulas</h2>
            
            {videoAulas.length > 0 ? (
              videoAulas
                .sort((a, b) => a.ordem - b.ordem)
                .map((aula: any) => (
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
                                Videoaula {aula.ordem}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          size="sm" 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/system/${systemId}/product/${productId}/lesson/${aula.id}`);
                          }}
                        >
                          Assistir
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <Card className="bg-gray-800/50 border-gray-700">
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
      </div>
    </Layout>
  );
};

export default ProductPage;
