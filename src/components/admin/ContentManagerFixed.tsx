
import React, { useState } from 'react';
import { SystemsListFixed } from './SystemsListFixed';
import { ProductsListFixed } from './ProductsListFixed';
import { VideoAulasList } from './VideoAulasList';
import { useSistemasFixed } from '@/hooks/useSupabaseDataFixed';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  sistema_id: string;
  ordem: number;
}

type ViewMode = 'sistemas' | 'produtos' | 'videoaulas';

export const ContentManagerFixed: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('sistemas');
  const [selectedSistema, setSelectedSistema] = useState<Sistema | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  
  const { data: sistemas, isLoading, error } = useSistemasFixed();

  const handleSelectSistema = (sistema: Sistema) => {
    setSelectedSistema(sistema);
    setViewMode('produtos');
  };

  const handleSelectProduto = (produto: Produto) => {
    setSelectedProduto(produto);
    setViewMode('videoaulas');
  };

  const handleBackToSistemas = () => {
    setViewMode('sistemas');
    setSelectedSistema(null);
    setSelectedProduto(null);
  };

  const handleBackToProdutos = () => {
    setViewMode('produtos');
    setSelectedProduto(null);
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-600">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mr-3" />
          <span className="text-white">Carregando conteúdo...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-800/50 border-red-600">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-semibold text-red-400 mb-2">Erro ao carregar conteúdo</h3>
          <p className="text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'Erro desconhecido'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'sistemas') {
    return (
      <SystemsListFixed
        sistemas={sistemas || []}
        onViewProdutos={handleSelectSistema}
      />
    );
  }

  if (viewMode === 'produtos' && selectedSistema) {
    const produtos = sistemas?.find(s => s.id === selectedSistema.id)?.produtos || [];
    return (
      <ProductsListFixed
        sistema={selectedSistema}
        produtos={produtos}
        onBack={handleBackToSistemas}
        onViewVideoAulas={handleSelectProduto}
      />
    );
  }

  if (viewMode === 'videoaulas' && selectedSistema && selectedProduto) {
    const produto = sistemas?.find(s => s.id === selectedSistema.id)?.produtos?.find(p => p.id === selectedProduto.id);
    const videoAulas = produto?.video_aulas || [];
    
    return (
      <VideoAulasList
        sistema={selectedSistema}
        produto={selectedProduto}
        videoAulas={videoAulas}
        onVideoAulasChange={() => {}}
        onBack={handleBackToProdutos}
      />
    );
  }

  return null;
};
