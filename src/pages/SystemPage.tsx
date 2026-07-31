import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Importa useAuth da versão FIXA
import { useAuth } from '@/contexts/AuthContextFixed'; 
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import SystemHeader from '@/components/system/SystemHeader';
import ProductsList from '@/components/system/ProductsList';
import LoadingState from '@/components/system/LoadingState';
import ErrorState from '@/components/system/ErrorState';
import { BookOpen } from 'lucide-react';
import { useSistemasCartorioWithAccess } from '@/hooks/useSistemasCartorioWithAccess';
import { logger } from '@/utils/logger';

const SystemPage = () => {
  const { systemId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: categorias, isLoading, error, refetch } = useSistemasCartorioWithAccess();

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
  const currentCategoria = categorias?.find(categoria => categoria.id === systemId);

  useEffect(() => {
    logger.info('🎯 [SystemPage] Categories data received', {
      systemId,
      categoriasCount: categorias?.length,
      currentCategoriaFound: !!currentCategoria,
      currentCategoriaName: currentCategoria?.nome,
      currentCategoriaProdutosCount: currentCategoria?.produtos?.length || 0,
      allCategoriaIds: categorias?.map(c => c.id) || []
    });
  }, [systemId, categorias, currentCategoria]);

  // Early return for loading state
  if (isLoading) {
    return <LoadingState message="Carregando categoria..." />;
  }

  // Early return for error state
  if (error) {
    logger.error('❌ [SystemPage] Error loading categoria:', { error: error.message });
    return (
      <ErrorState 
        title="Erro ao carregar categoria"
        message={error instanceof Error ? error.message : 'Erro desconhecido'}
        onRetry={() => refetch()}
      />
    );
  }

  // Early return for system not found
  if (!currentCategoria) {
    logger.error('❌ [SystemPage] Categoria not found:', { 
      systemId, 
      availableCategorias: categorias?.map(c => ({ id: c.id, nome: c.nome })) 
    });
    
    return (
      <ErrorState 
        title="Categoria não encontrada"
        message="A categoria solicitada não foi encontrada ou você não tem permissão para acessá-la."
      />
    );
  }

  const produtos = currentCategoria.produtos || [];
  logger.info('🎯 [SystemPage] Products found', { count: produtos.length });

  return (
    <Layout>
      <div className="min-h-screen page-transition">
        <div className="container mx-auto px-6 py-8">
          <Breadcrumbs items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: currentCategoria?.nome || 'Categoria' }
          ]} />
          
          <div className="mt-6 mb-8">
            <SystemHeader system={currentCategoria} />
          </div>

          <div className="mb-8">
            <div className="flex items-center mb-6">
              <span className="mr-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <BookOpen className="h-5 w-5" />
              </span>
              <h2 className="text-2xl font-bold text-foreground">
                Produtos
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