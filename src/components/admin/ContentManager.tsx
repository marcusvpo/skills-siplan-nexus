
import React, { useState, useEffect } from 'react';
import { SystemsList } from './SystemsList';
import { ProductsList } from './ProductsList';
import { VideoAulasList } from './VideoAulasList';
import { supabase } from '@/integrations/supabase/client';

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

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny: string;
  duracao_segundos: number;
  ordem: number;
  modulo_id: string;
}

type ViewMode = 'sistemas' | 'produtos' | 'videoaulas';

export const ContentManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('sistemas');
  const [selectedSistema, setSelectedSistema] = useState<Sistema | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [videoAulas, setVideoAulas] = useState<VideoAula[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);

  // Load sistemas
  const loadSistemas = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sistemas')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (!error && data) setSistemas(data);
    } catch (error) {
      console.error('Error loading sistemas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load produtos by sistema
  const loadProdutos = async (sistemaId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('sistema_id', sistemaId)
        .order('ordem', { ascending: true });
      
      if (!error && data) setProdutos(data);
    } catch (error) {
      console.error('Error loading produtos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load video aulas by produto
  const loadVideoAulas = async (produtoId: string) => {
    setIsLoading(true);
    try {
      // First get the modulo for this product
      const { data: modulos, error: modulosError } = await supabase
        .from('modulos')
        .select('id')
        .eq('produto_id', produtoId);

      if (modulosError) throw modulosError;

      if (modulos && modulos.length > 0) {
        const moduloIds = modulos.map(m => m.id);
        
        const { data, error } = await supabase
          .from('video_aulas')
          .select('*')
          .in('modulo_id', moduloIds)
          .order('ordem', { ascending: true });
        
        if (!error && data) setVideoAulas(data);
      } else {
        setVideoAulas([]);
      }
    } catch (error) {
      console.error('Error loading video aulas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSistemas();
  }, []);

  const handleSelectSistema = (sistema: Sistema) => {
    setSelectedSistema(sistema);
    setViewMode('produtos');
    loadProdutos(sistema.id);
  };

  const handleSelectProduto = (produto: Produto) => {
    setSelectedProduto(produto);
    setViewMode('videoaulas');
    loadVideoAulas(produto.id);
  };

  const handleBackToSistemas = () => {
    setViewMode('sistemas');
    setSelectedSistema(null);
    setSelectedProduto(null);
    loadSistemas();
  };

  const handleBackToProdutos = () => {
    setViewMode('produtos');
    setSelectedProduto(null);
    if (selectedSistema) {
      loadProdutos(selectedSistema.id);
    }
  };

  if (viewMode === 'sistemas') {
    return (
      <SystemsList
        sistemas={sistemas}
        onSystemsChange={loadSistemas}
        onSelectSystem={handleSelectSistema}
      />
    );
  }

  if (viewMode === 'produtos' && selectedSistema) {
    return (
      <ProductsList
        sistema={selectedSistema}
        produtos={produtos}
        onProductsChange={() => loadProdutos(selectedSistema.id)}
        onBack={handleBackToSistemas}
        onSelectProduct={handleSelectProduto}
      />
    );
  }

  if (viewMode === 'videoaulas' && selectedSistema && selectedProduto) {
    return (
      <VideoAulasList
        sistema={selectedSistema}
        produto={selectedProduto}
        videoAulas={videoAulas}
        onVideoAulasChange={() => loadVideoAulas(selectedProduto.id)}
        onBack={handleBackToProdutos}
      />
    );
  }

  return null;
};
