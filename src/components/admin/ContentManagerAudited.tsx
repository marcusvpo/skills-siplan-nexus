
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Play,
  FolderOpen,
  Video,
  Package
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { useSistemasWithVideoAulas, useCreateVideoAula, useDeleteVideoAula } from '@/hooks/useSupabaseDataRefactored';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'sistemas' | 'produtos' | 'videoaulas';

interface ViewState {
  mode: ViewMode;
  sistemaId?: string;
  sistemaNome?: string;
  produtoId?: string;
  produtoNome?: string;
}

const ContentManagerAudited: React.FC = () => {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>({ mode: 'sistemas' });
  
  const { data: sistemas = [], isLoading, error, refetch } = useSistemasWithVideoAulas();
  const createVideoAulaMutation = useCreateVideoAula();
  const deleteVideoAulaMutation = useDeleteVideoAula();

  // Log do estado atual para debugging
  React.useEffect(() => {
    logger.info('🎯 [ContentManagerAudited] Current view state:', viewState);
  }, [viewState]);

  React.useEffect(() => {
    if (error) {
      logger.error('❌ [ContentManagerAudited] Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar o conteúdo. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [error]);

  const handleNavigateToProductos = (sistemaId: string, sistemaNome: string) => {
    logger.info('🧭 [ContentManagerAudited] Navigating to produtos of sistema:', sistemaId);
    setViewState({
      mode: 'produtos',
      sistemaId,
      sistemaNome
    });
  };

  const handleNavigateToVideoaulas = (produtoId: string, produtoNome: string) => {
    logger.info('🧭 [ContentManagerAudited] Navigating to videoaulas of produto:', produtoId);
    setViewState({
      ...viewState,
      mode: 'videoaulas',
      produtoId,
      produtoNome
    });
  };

  const handleBackToSistemas = () => {
    logger.info('🔙 [ContentManagerAudited] Back to sistemas');
    setViewState({ mode: 'sistemas' });
    refetch();
  };

  const handleBackToProductos = () => {
    logger.info('🔙 [ContentManagerAudited] Back to produtos');
    setViewState({
      mode: 'produtos',
      sistemaId: viewState.sistemaId,
      sistemaNome: viewState.sistemaNome
    });
  };

  const handleCreateVideoAula = () => {
    if (!viewState.produtoId) return;
    
    logger.info('➕ [ContentManagerAudited] Creating new videoaula for produto:', viewState.produtoId);
    
    navigate(`/admin/videoaula/nova?sistema_id=${viewState.sistemaId}&produto_id=${viewState.produtoId}`);
  };

  const handleEditVideoAula = (videoAulaId: string) => {
    logger.info('✏️ [ContentManagerAudited] Editing videoaula:', videoAulaId);
    navigate(`/admin/videoaula/${videoAulaId}`);
  };

  const handleDeleteVideoAula = async (videoAulaId: string, titulo: string) => {
    if (!confirm(`Tem certeza que deseja excluir a videoaula "${titulo}"?`)) {
      return;
    }

    logger.info('🗑️ [ContentManagerAudited] Deleting videoaula:', videoAulaId);
    
    try {
      await deleteVideoAulaMutation.mutateAsync(videoAulaId);
      toast({
        title: "Videoaula excluída",
        description: `"${titulo}" foi excluída com sucesso.`,
      });
      refetch();
    } catch (error) {
      logger.error('❌ Error deleting videoaula:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a videoaula.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando conteúdo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-400 mb-4">⚠️</div>
          <p className="text-gray-400 mb-4">Erro ao carregar conteúdo</p>
          <Button onClick={() => refetch()} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Renderizar lista de sistemas
  if (viewState.mode === 'sistemas') {
    return (
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Sistemas ({sistemas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sistemas.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Nenhum sistema encontrado</p>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Sistema
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sistemas.map((sistema) => (
                <div
                  key={sistema.id}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700/70 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{sistema.nome}</h3>
                    {sistema.descricao && (
                      <p className="text-gray-400 text-sm mt-1">{sistema.descricao}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary">
                        {sistema.produtos?.length || 0} produtos
                      </Badge>
                      <Badge variant="secondary">
                        {sistema.produtos?.reduce((total, produto) => 
                          total + (produto.video_aulas?.length || 0), 0
                        ) || 0} videoaulas
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleNavigateToProductos(sistema.id, sistema.nome)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:text-white"
                  >
                    Ver Produtos
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Renderizar lista de produtos
  if (viewState.mode === 'produtos') {
    const sistema = sistemas.find(s => s.id === viewState.sistemaId);
    const produtos = sistema?.produtos || [];

    return (
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Button
                onClick={handleBackToSistemas}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white mr-3"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Package className="h-5 w-5 mr-2" />
              {viewState.sistemaNome} - Produtos ({produtos.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {produtos.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Nenhum produto encontrado para este sistema</p>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Produto
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {produtos.map((produto) => (
                <div
                  key={produto.id}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700/70 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{produto.nome}</h3>
                    {produto.descricao && (
                      <p className="text-gray-400 text-sm mt-1">{produto.descricao}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary">
                        {produto.video_aulas?.length || 0} videoaulas
                      </Badge>
                      <Badge variant="outline">
                        Ordem: {produto.ordem}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleNavigateToVideoaulas(produto.id, produto.nome)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:text-white"
                  >
                    Ver Videoaulas
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Renderizar lista de videoaulas
  if (viewState.mode === 'videoaulas') {
    const sistema = sistemas.find(s => s.id === viewState.sistemaId);
    const produto = sistema?.produtos?.find(p => p.id === viewState.produtoId);
    const videoaulas = produto?.video_aulas || [];

    return (
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Button
                onClick={handleBackToProductos}
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white mr-3"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Video className="h-5 w-5 mr-2" />
              {viewState.produtoNome} - Videoaulas ({videoaulas.length})
            </CardTitle>
            <Button
              onClick={handleCreateVideoAula}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Videoaula
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {videoaulas.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Nenhuma videoaula encontrada para este produto</p>
              <Button
                onClick={handleCreateVideoAula}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Videoaula
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {videoaulas.map((videoaula) => (
                <div
                  key={videoaula.id}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700/70 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{videoaula.titulo}</h3>
                    {videoaula.descricao && (
                      <p className="text-gray-400 text-sm mt-1">{videoaula.descricao}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="outline">Ordem: {videoaula.ordem}</Badge>
                      {videoaula.url_video && (
                        <Badge variant="secondary">
                          <Play className="h-3 w-3 mr-1" />
                          Vídeo
                        </Badge>
                      )}
                      {videoaula.id_video_bunny && (
                        <Badge variant="secondary">Bunny.net</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleEditVideoAula(videoaula.id)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-300 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteVideoAula(videoaula.id, videoaula.titulo)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-300 hover:text-red-400"
                      disabled={deleteVideoAulaMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default ContentManagerAudited;
