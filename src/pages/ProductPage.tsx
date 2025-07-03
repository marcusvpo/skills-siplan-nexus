
import React from 'react';
import { useParams } from 'react-router-dom';
import { ProductHeader } from '@/components/product/ProductHeader';
import VideoAulasList from '@/components/product/VideoAulasList';
import { LoadingState } from '@/components/system/LoadingState';
import { ErrorState } from '@/components/system/ErrorState';
import { useProductData } from '@/hooks/useSupabaseDataSimplified';
import { logger } from '@/utils/logger';

const ProductPage: React.FC = () => {
  const { systemId, productId } = useParams<{ 
    systemId: string; 
    productId: string; 
  }>();
  
  const { data: produto, isLoading, error } = useProductData(productId || '');

  if (!systemId || !productId) {
    return <ErrorState message="IDs do sistema e produto são obrigatórios" />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !produto) {
    logger.error('❌ [ProductPage] Error or no data:', { error: error?.message });
    return <ErrorState message={error?.message || 'Produto não encontrado'} />;
  }

  const { video_aulas, sistemas } = produto;

  logger.info('✅ [ProductPage] Video aulas found:', { 
    productName: produto.nome, 
    videoAulasCount: video_aulas?.length || 0 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <ProductHeader 
        produto={produto} 
        sistema={sistemas}
        systemId={systemId}
      />
      
      <div className="container mx-auto px-4 py-8">
        <VideoAulasList 
          videoAulas={video_aulas || []} 
          systemId={systemId}
          productId={productId}
        />
      </div>
    </div>
  );
};

export default ProductPage;
