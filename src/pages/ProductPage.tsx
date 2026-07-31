import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed'; 
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductHeader from '@/components/product/ProductHeader';
import { ProductProgressReativo } from '@/components/product/ProductProgressReativo';
import VideoAulasList from '@/components/product/VideoAulasList';
import LoadingState from '@/components/system/LoadingState';
import ErrorState from '@/components/system/ErrorState';
import { useSistemasCartorioWithAccess } from '@/hooks/useSistemasCartorioWithAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, BookOpen } from 'lucide-react';
import { logger } from '@/utils/logger';

const ProductPage = () => {
  const { systemId, productId } = useParams<{ 
    systemId: string; 
    productId: string; 
  }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: sistemas, isLoading, error, refetch } = useSistemasCartorioWithAccess();

  // Buscar trilhas do produto
  const { data: trilhas, isLoading: isLoadingTrilhas } = useQuery({
    queryKey: ['trilhas', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('trilhas')
        .select(`
          *,
          trilha_aulas(video_aula_id)
        `)
        .eq('produto_id', productId)
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });

  React.useEffect(() => {
    logger.info('🎯 [ProductPage] Page loaded', { 
      systemId, 
      productId, 
      isAuthenticated,
      userType: user?.type,
      cartorioId: user?.cartorio_id
    });

    if (!isAuthenticated || !user || user.type !== 'cartorio') {
      logger.warn('⚠️ [ProductPage] User not authenticated or not cartorio type');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, user, navigate, systemId, productId]);

  // Find the current system and product
  let currentSystem = null;
  let currentProduct = null;
  
  if (sistemas && sistemas.length > 0) {
    logger.info('🔍 [ProductPage] Searching for system and product', {
      sistemasCount: sistemas.length,
      targetSystemId: systemId,
      targetProductId: productId
    });

    for (const system of sistemas) {
      if (system.id === systemId) {
        currentSystem = system;
        logger.info('✅ [ProductPage] System found', { 
          systemId: system.id, 
          systemName: system.nome,
          productsCount: system.produtos?.length || 0
        });

        if (system.produtos && system.produtos.length > 0) {
          for (const product of system.produtos) {
            if (product.id === productId) {
              currentProduct = product;
              logger.info('✅ [ProductPage] Product found', { 
                productId: product.id, 
                productName: product.nome,
                videoAulasCount: product.video_aulas?.length || 0
              });
              break;
            }
          }
        } else {
          logger.warn('⚠️ [ProductPage] System has no products', { systemId: system.id });
        }
        break;
      }
    }
  }

  // Early return for loading state
  if (isLoading || isLoadingTrilhas) {
    return <LoadingState message="Carregando produto..." />;
  }

  // Early return for error or not found
  if (error) {
    logger.error('❌ [ProductPage] Error loading data:', { error: error.message });
    return (
      <ErrorState 
        title="Erro ao carregar dados"
        message={error instanceof Error ? error.message : 'Erro desconhecido'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!currentSystem) {
    logger.error('❌ [ProductPage] System not found:', { 
      systemId,
      availableSystems: sistemas?.map(s => ({ id: s.id, nome: s.nome })) 
    });
    
    return (
      <ErrorState 
        title="Sistema não encontrado"
        message="O sistema solicitado não foi encontrado ou você não tem permissão para acessá-lo."
      />
    );
  }

  if (!currentProduct) {
    logger.error('❌ [ProductPage] Product not found:', { 
      productId,
      systemId,
      availableProducts: currentSystem.produtos?.map(p => ({ id: p.id, nome: p.nome })) || []
    });
    
    return (
      <ErrorState 
        title="Produto não encontrado"
        message="O produto solicitado não foi encontrado ou você não tem permissão para acessá-lo."
      />
    );
  }

  const videoAulas = currentProduct.video_aulas || [];
  const hasTrilhas = trilhas && trilhas.length > 0;

  logger.info('🎯 [ProductPage] Final state', { 
    videoAulasCount: videoAulas.length,
    trilhasCount: trilhas?.length || 0,
    willShowTrilhas: hasTrilhas
  });

  return (
    <Layout>
      <div className="min-h-screen page-transition">
        <div className="container mx-auto px-6 py-8">
          <Breadcrumbs items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: currentSystem?.nome || 'Sistema', href: `/system/${systemId}` },
            { label: currentProduct?.nome || 'Produto' }
          ]} />
          
          <div className="mt-6 mb-8">
            <ProductHeader product={currentProduct} system={currentSystem} />
          </div>

          <ProductProgressReativo 
            produtoId={currentProduct.id} 
            produtoNome={currentProduct.nome} 
          />

          <div className="space-y-4 mt-8">
            {hasTrilhas ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Trilhas de Aprendizagem</h2>
                    <p className="mt-1 text-muted-foreground">
                      Escolha uma trilha estruturada para aprender no seu ritmo
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trilhas.map((trilha) => (
                    <Card 
                      key={trilha.id}
                      interactive
                      className="cursor-pointer"
                      onClick={() => navigate(`/system/${systemId}/product/${productId}/trilha/${trilha.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                            <BookOpen className="h-5 w-5" />
                          </span>
                          <Badge variant="secondary">
                            {trilha.trilha_aulas?.length || 0} aulas
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{trilha.nome}</CardTitle>
                        <CardDescription>
                          Trilha estruturada de aprendizagem
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          variant="glow"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/system/${systemId}/product/${productId}/trilha/${trilha.id}`);
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Trilha
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-4 text-2xl font-bold text-foreground">Videoaulas</h2>
                
                <VideoAulasList 
                  videoAulas={videoAulas} 
                  systemId={systemId!} 
                  productId={productId!} 
                />
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductPage;
