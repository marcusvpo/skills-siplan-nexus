
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ChevronRight, Plus, Settings, Video } from 'lucide-react';
import { 
  useSistemasAudited, 
  useProdutosBySystem,
  useVideoAulasByProduct 
} from '@/hooks/useSupabaseDataAudited';
import { SystemFormAudited } from './SystemFormAudited';
import { ProductFormAudited } from './ProductFormAudited';
import { VideoAulasListAudited } from './VideoAulasListAudited';

type ViewMode = 'sistemas' | 'produtos' | 'videoaulas';

interface ViewState {
  mode: ViewMode;
  sistemaId?: string;
  sistemaNome?: string;
  produtoId?: string;
  produtoNome?: string;
}

export const ContentManagerAudited: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>({ mode: 'sistemas' });
  const [showSystemForm, setShowSystemForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingSystem, setEditingSystem] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  console.log('🎯 [ContentManagerAudited] Current view state:', viewState);

  // Queries
  const { 
    data: sistemas = [], 
    isLoading: sistemasLoading, 
    error: sistemasError,
    refetch: refetchSistemas
  } = useSistemasAudited();

  const { 
    data: produtos = [], 
    isLoading: produtosLoading, 
    error: produtosError,
    refetch: refetchProdutos
  } = useProdutosBySystem(viewState.sistemaId || '');

  const {
    data: videoAulas = [],
    isLoading: videoAulasLoading,
    error: videoAulasError,
    refetch: refetchVideoAulas
  } = useVideoAulasByProduct(viewState.produtoId || '');

  // Navigation handlers
  const navigateToSistemas = () => {
    console.log('🧭 [ContentManagerAudited] Navigating to sistemas');
    setViewState({ mode: 'sistemas' });
    setShowSystemForm(false);
    setShowProductForm(false);
    setEditingSystem(null);
    setEditingProduct(null);
  };

  const navigateToProdutos = (sistemaId: string, sistemaNome: string) => {
    console.log('🧭 [ContentManagerAudited] Navigating to produtos of sistema:', sistemaId);
    setViewState({ 
      mode: 'produtos', 
      sistemaId, 
      sistemaNome 
    });
    setShowSystemForm(false);
    setShowProductForm(false);
    setEditingSystem(null);
    setEditingProduct(null);
  };

  const navigateToVideoAulas = (produtoId: string, produtoNome: string) => {
    console.log('🧭 [ContentManagerAudited] Navigating to videoaulas of produto:', produtoId);
    setViewState({ 
      ...viewState,
      mode: 'videoaulas', 
      produtoId, 
      produtoNome 
    });
  };

  // Form handlers
  const handleSystemFormSuccess = () => {
    setShowSystemForm(false);
    setEditingSystem(null);
    refetchSistemas();
  };

  const handleProductFormSuccess = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    refetchProdutos();
    refetchSistemas(); // Refresh sistemas to update produto counts
  };

  const handleVideoAulasChange = () => {
    refetchVideoAulas();
    refetchProdutos(); // Refresh produtos to update videoaula counts
    refetchSistemas(); // Refresh sistemas to update total counts
  };

  // Render error state
  const renderError = (error: any, context: string) => (
    <Card className="bg-red-50 border-red-200">
      <CardContent className="pt-6">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Erro ao carregar {context}</span>
        </div>
        <p className="text-red-500 text-sm mt-2">
          {error?.message || 'Erro desconhecido'}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-3"
          onClick={() => {
            if (context === 'sistemas') refetchSistemas();
            else if (context === 'produtos') refetchProdutos();
            else if (context === 'videoaulas') refetchVideoAulas();
          }}
        >
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  );

  // Render loading state
  const renderLoading = (count: number = 3) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <Skeleton className="h-6 w-3/4 bg-gray-700" />
            <Skeleton className="h-4 w-full bg-gray-700" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full bg-gray-700" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render breadcrumb
  const renderBreadcrumb = () => (
    <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
      <button 
        onClick={navigateToSistemas}
        className="hover:text-white transition-colors"
      >
        Sistemas
      </button>
      {viewState.mode !== 'sistemas' && (
        <>
          <ChevronRight className="h-4 w-4" />
          <button 
            onClick={() => navigateToProdutos(viewState.sistemaId!, viewState.sistemaNome!)}
            className="hover:text-white transition-colors"
          >
            {viewState.sistemaNome} 
          </button>
        </>
      )}
      {viewState.mode === 'videoaulas' && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">{viewState.produtoNome}</span>
        </>
      )}
    </div>
  );

  // Render sistemas view
  const renderSistemas = () => {
    if (sistemasError) return renderError(sistemasError, 'sistemas');
    if (sistemasLoading) return renderLoading();

    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Gerenciar Sistemas</h2>
            <p className="text-gray-300">
              {sistemas.length} sistema{sistemas.length !== 1 ? 's' : ''} cadastrado{sistemas.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button 
            onClick={() => setShowSystemForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Sistema
          </Button>
        </div>

        {showSystemForm && (
          <div className="mb-6">
            <SystemFormAudited
              sistema={editingSystem}
              onSuccess={handleSystemFormSuccess}
              onCancel={() => {
                setShowSystemForm(false);
                setEditingSystem(null);
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sistemas.map((sistema) => (
            <Card key={sistema.id} className="bg-gray-800/50 border-gray-600 hover:bg-gray-800/70 transition-colors">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="truncate">{sistema.nome}</span>
                  <Badge variant="secondary" className="ml-2">
                    {sistema.produtos?.length || 0}
                  </Badge>
                </CardTitle>
                {sistema.descricao && (
                  <p className="text-gray-300 text-sm line-clamp-2">{sistema.descricao}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Ordem: {sistema.ordem}</span>
                  <span>
                    {sistema.produtos?.reduce((acc, p) => acc + (p.video_aulas?.length || 0), 0) || 0} videoaulas
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToProdutos(sistema.id, sistema.nome)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50 flex-1"
                  >
                    Ver Produtos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSystem(sistema);
                      setShowSystemForm(true);
                    }}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sistemas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhum sistema cadastrado</p>
            <p className="text-gray-500 text-sm mt-2">
              Clique em "Novo Sistema" para começar
            </p>
          </div>
        )}
      </>
    );
  };

  // Render produtos view
  const renderProdutos = () => {
    if (produtosError) return renderError(produtosError, 'produtos');
    if (produtosLoading) return renderLoading();

    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Produtos do Sistema</h2>
            <p className="text-gray-300">
              {produtos.length} produto{produtos.length !== 1 ? 's' : ''} em {viewState.sistemaNome}
            </p>
          </div>
          <Button 
            onClick={() => setShowProductForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>

        {showProductForm && (
          <div className="mb-6">
            <ProductFormAudited
              sistemaId={viewState.sistemaId!}
              sistemaNome={viewState.sistemaNome!}
              produto={editingProduct}
              onSuccess={handleProductFormSuccess}
              onCancel={() => {
                setShowProductForm(false);
                setEditingProduct(null);
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {produtos.map((produto) => (
            <Card key={produto.id} className="bg-gray-800/50 border-gray-600 hover:bg-gray-800/70 transition-colors">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="truncate">{produto.nome}</span>
                  <Badge variant="secondary" className="ml-2">
                    {produto.video_aulas?.length || 0}
                  </Badge>
                </CardTitle>
                {produto.descricao && (
                  <p className="text-gray-300 text-sm line-clamp-2">{produto.descricao}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-400">
                  Ordem: {produto.ordem}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToVideoAulas(produto.id, produto.nome)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50 flex-1"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Videoaulas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingProduct(produto);
                      setShowProductForm(true);
                    }}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {produtos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhum produto cadastrado neste sistema</p>
            <p className="text-gray-500 text-sm mt-2">
              Clique em "Novo Produto" para começar
            </p>
          </div>
        )}
      </>
    );
  };

  // Render videoaulas view
  const renderVideoAulas = () => {
    if (videoAulasError) return renderError(videoAulasError, 'videoaulas');

    const sistema = sistemas.find(s => s.id === viewState.sistemaId);
    const produto = produtos.find(p => p.id === viewState.produtoId);

    if (!sistema || !produto) {
      return (
        <div className="text-center py-12">
          <p className="text-red-400">Erro: Sistema ou Produto não encontrado</p>
        </div>
      );
    }

    return (
      <VideoAulasListAudited
        sistema={sistema}
        produto={produto}
        videoAulas={videoAulas}
        onVideoAulasChange={handleVideoAulasChange}
        onBack={() => navigateToProdutos(viewState.sistemaId!, viewState.sistemaNome!)}
      />
    );
  };

  return (
    <div className="space-y-6">
      {renderBreadcrumb()}
      
      {viewState.mode === 'sistemas' && renderSistemas()}
      {viewState.mode === 'produtos' && renderProdutos()}
      {viewState.mode === 'videoaulas' && renderVideoAulas()}
    </div>
  );
};
