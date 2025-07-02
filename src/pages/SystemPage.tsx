
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import SystemHeader from '@/components/system/SystemHeader';
import ProductsList from '@/components/system/ProductsList';
import LoadingState from '@/components/system/LoadingState';
import ErrorState from '@/components/system/ErrorState';
import { BookOpen } from 'lucide-react';
import { useSistemasCartorioWithAccess } from '@/hooks/useSupabaseDataWithAccess';
import { logger } from '@/utils/logger';

const SystemPage = () => {
  const { systemId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: sistemas, isLoading, error, refetch } = useSistemasCartorioWithAccess();

  useEffect(() => {
    logger.info('🎯 [SystemPage] Page loaded', {
      systemId,
      isAuthenticated,
      userType: user?.type,
      cartorioId: user?.cartorio_id
    });

    if (!isAuthenticated || !user || user.type !== 'cartorio') {
      logger.warn('⚠️ [SystemPage] User not authenticated or not cartorio type');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, user, navigate, systemId]);

  // Find the current system
  const currentSystem = sistemas?.find(system => system.id === systemId);

  useEffect(() => {
    logger.info('🎯 [SystemPage] Systems data received', {
      systemId,
      sistemasCount: sistemas?.length,
      currentSystemFound: !!currentSystem,
      currentSystemName: currentSystem?.nome,
      currentSystemProductsCount: currentSystem?.produtos?.length || 0,
      allSystemIds: sistemas?.map(s => s.id) || []
    });
  }, [systemId, sistemas, currentSystem]);

  // Early return for loading state
  if (isLoading) {
    return <LoadingState message="Carregando sistema..." />;
  }

  // Early return for error state
  if (error) {
    logger.error('❌ [SystemPage] Error loading system:', { error: error.message });
    return (
      <ErrorState 
        title="Erro ao carregar sistema"
        message={error instanceof Error ? error.message : 'Erro desconhecido'}
        onRetry={() => refetch()}
      />
    );
  }

  // Early return for system not found
  if (!currentSystem) {
    logger.error('❌ [SystemPage] System not found:', { 
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

  const produtos = currentSystem.produtos || [];
  logger.info('🎯 [SystemPage] Products found', { count: produtos.length });

  return (
    <Layout>
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-6 py-8">
          <Breadcrumbs items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: currentSystem?.nome || 'Sistema' }
          ]} />
          
          <div className="mt-6 mb-8">
            <SystemHeader system={currentSystem} />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <BookOpen className="h-6 w-6 mr-3 text-blue-400" />
              Produtos de Treinamento
            </h2>
            
            <ProductsList products={produtos} systemId={systemId!} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SystemPage;
