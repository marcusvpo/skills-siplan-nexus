
import React, { useState } from 'react';
import { SystemsListFixed } from './SystemsListFixed';
import { ProductsListFixed } from './ProductsListFixed';
import { VideoAulasList } from './VideoAulasList';
import { useSistemasWithVideoAulas, useVideoAulasByProduto } from '@/hooks/useSupabaseDataRefactored';

interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  produtos?: Produto[];
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  sistema_id: string;
  ordem: number;
  video_aulas?: VideoAula[];
}

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny?: string;
  url_thumbnail?: string;
  ordem: number;
  produto_id: string;
}

type ViewState = 'sistemas' | 'produtos' | 'videoaulas';

export const ContentManagerRefactored: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('sistemas');
  const [selectedSistema, setSelectedSistema] = useState<Sistema | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

  const { data: sistemas = [], isLoading, refetch: refetchSistemas } = useSistemasWithVideoAulas();
  const { data: videoAulasData = [], refetch: refetchVideoAulas } = useVideoAulasByProduto(selectedProduto?.id || '');

  // Ensure type compatibility by mapping the data to match our local VideoAula interface
  const videoAulas: VideoAula[] = videoAulasData.map(va => ({
    id: va.id,
    titulo: va.titulo,
    descricao: va.descricao || undefined,
    url_video: va.url_video,
    id_video_bunny: va.id_video_bunny || undefined,
    url_thumbnail: va.url_thumbnail || undefined,
    ordem: va.ordem,
    produto_id: va.produto_id || selectedProduto?.id || ''
  }));

  const handleViewProdutos = (sistema: Sistema) => {
    setSelectedSistema(sistema);
    setCurrentView('produtos');
  };

  const handleViewVideoAulas = (produto: Produto) => {
    setSelectedProduto(produto);
    setCurrentView('videoaulas');
  };

  const handleBackToSistemas = () => {
    setSelectedSistema(null);
    setSelectedProduto(null);
    setCurrentView('sistemas');
    refetchSistemas();
  };

  const handleBackToProdutos = () => {
    setSelectedProduto(null);
    setCurrentView('produtos');
  };

  const handleSistemasChange = () => {
    refetchSistemas();
  };

  const handleVideoAulasChange = () => {
    refetchVideoAulas();
    refetchSistemas(); // Também atualiza a lista de sistemas para refletir mudanças
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {currentView === 'sistemas' && (
        <SystemsListFixed 
          sistemas={sistemas}
          onViewProdutos={handleViewProdutos}
        />
      )}

      {currentView === 'produtos' && selectedSistema && (
        <ProductsListFixed 
          sistema={selectedSistema}
          produtos={selectedSistema.produtos || []}
          onBack={handleBackToSistemas}
          onViewVideoAulas={handleViewVideoAulas}
        />
      )}

      {currentView === 'videoaulas' && selectedSistema && selectedProduto && (
        <VideoAulasList 
          sistema={selectedSistema}
          produto={selectedProduto}
          videoAulas={videoAulas}
          onVideoAulasChange={handleVideoAulasChange}
          onBack={handleBackToProdutos}
        />
      )}
    </div>
  );
};
