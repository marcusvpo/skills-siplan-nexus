
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductHeader from '@/components/product/ProductHeader';
import { ProductProgressReativo } from '@/components/product/ProductProgressReativo';
import VideoAulasList from '@/components/product/VideoAulasList';
import { useProgressoReativo } from '@/hooks/useProgressoReativo';
import LoadingState from '@/components/system/LoadingState';
import ErrorState from '@/components/system/ErrorState';
import { useSistemasCartorioWithAccess } from '@/hooks/useSupabaseDataWithAccess';
import { logger } from '@/utils/logger';

const ProductPage = () => {
  const { systemId, productId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: sistemas, isLoading, error, refetch } = useSistemasCartorioWithAccess();
  
  // Hook para progresso reativo
  const { marcarVideoCompleto } = useProgressoReativo(productId!);

  useEffect(() => {
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

  useEffect(() => {
    logger.info('🎯 [ProductPage] Final state check', { 
      sistemasCount: sistemas?.length,
      currentSystemFound: !!currentSystem,
      currentProductFound: !!currentProduct,
      currentSystemName: currentSystem?.nome,
      currentProductName: currentProduct?.nome
    });
  }, [sistemas, currentSystem, currentProduct]);

  // Early return for loading state
  if (isLoading) {
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
  logger.info('🎯 [ProductPage] Video aulas found', { count: videoAulas.length });

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

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4 text-enhanced">Videoaulas</h2>
            
            <VideoAulasList 
              videoAulas={videoAulas} 
              systemId={systemId!} 
              productId={productId!} 
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductPage;
