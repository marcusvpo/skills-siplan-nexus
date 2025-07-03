
import React from 'react';
import { useParams } from 'react-router-dom';
import { SystemHeader } from '@/components/system/SystemHeader';
import { ProductsList } from '@/components/system/ProductsList';
import { LoadingState } from '@/components/system/LoadingState';
import { ErrorState } from '@/components/system/ErrorState';
import { useSystemData } from '@/hooks/useSupabaseDataSimplified';
import { logger } from '@/utils/logger';

const SystemPage: React.FC = () => {
  const { systemId } = useParams<{ systemId: string }>();
  const { data: sistema, isLoading, error } = useSystemData(systemId || '');

  if (!systemId) {
    return <ErrorState message="ID do sistema não fornecido" />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !sistema) {
    logger.error('❌ [SystemPage] Error or no data:', { error: error?.message });
    return <ErrorState message={error?.message || 'Sistema não encontrado'} />;
  }

  const { produtos } = sistema;
  
  logger.info('✅ [SystemPage] Products found:', { 
    systemName: sistema.nome, 
    productsCount: produtos?.length || 0 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <SystemHeader sistema={sistema} />
      
      <div className="container mx-auto px-4 py-8">
        <ProductsList 
          produtos={produtos || []} 
          systemId={systemId}
        />
      </div>
    </div>
  );
};

export default SystemPage;
