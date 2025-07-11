
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed';
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
    return <LoadingState message="Carregando categoria..." />;
  }

  // Early return for error state
  if (error) {
    logger.error('❌ [SystemPage] Error loading system:', { error: error.message });
    return (
      <ErrorState 
        title="Erro ao carregar categoria"
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
        title="Categoria não encontrada"
        message="A categoria solicitada não foi encontrada ou você não tem permissão para acessá-la."
      />
    );
  }

  const produtos = currentSystem.produtos || [];
  logger.info('🎯 [SystemPage] Products found', { count: produtos.length });

  return (
    <Layout>
      <div className="min-h-screen page-transition">
        <div className="container mx-auto px-6 py-8">
          <Breadcrumbs items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: currentSystem?.nome || 'Categoria' }
          ]} />
          
          <div className="mt-6 mb-8">
            <SystemHeader system={currentSystem} />
          </div>

          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg mr-3 shadow-modern">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white text-enhanced">
                Produtos de Treinamento
              </h2>
            </div>
            
            <ProductsList products={produtos} systemId={systemId!} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SystemPage;
