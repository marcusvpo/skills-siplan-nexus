
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductHeader from '@/components/product/ProductHeader';
import VideoAulasList from '@/components/product/VideoAulasList';
import LoadingState from '@/components/system/LoadingState';
import ErrorState from '@/components/system/ErrorState';
import { useSistemasCartorioWithAccess } from '@/hooks/useSupabaseDataWithAccess';
import { logger } from '@/utils/logger';

const ProductPage = () => {
  const { systemId, productId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: sistemas, isLoading, error, refetch } = useSistemasCartorioWithAccess();

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

  useEffect(() => {
    logger.info('🎯 [ProductPage] Systems and products loaded', { 
      sistemasCount: sistemas?.length,
      currentSystem: currentSystem ? { id: currentSystem.id, nome: currentSystem.nome } : null,
      currentProduct: currentProduct ? { id: currentProduct.id, nome: currentProduct.nome } : null
    });
  }, [sistemas, currentSystem, currentProduct]);

  // Early return for loading state
  if (isLoading) {
    return <LoadingState message="Carregando produto..." />;
  }

  // Early return for error or not found
  if (error || !currentSystem || !currentProduct) {
    logger.error('❌ [ProductPage] Error or not found', { 
      error: error?.message, 
      currentSystem: !!currentSystem, 
      currentProduct: !!currentProduct 
    });
    
    return (
      <ErrorState 
        title="Produto não encontrado"
        message="O produto solicitado não foi encontrado ou você não tem permissão para acessá-lo."
        onRetry={error ? () => refetch() : undefined}
      />
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
            <ProductHeader product={currentProduct} system={currentSystem} />
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Videoaulas</h2>
            
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
