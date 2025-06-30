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
  ordem: number;
  produto_id: string;
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
      console.log('Loading sistemas for admin...');
      const { data, error } = await supabase
        .from('sistemas')
        .select('*')
        .order('ordem', { ascending: true });
      
      console.log('Sistemas loaded:', data, 'Error:', error);
      if (!error && data) {
        setSistemas(data);
      } else {
        console.error('Error loading sistemas:', error);
      }
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
      console.log('Loading produtos for sistema:', sistemaId);
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('sistema_id', sistemaId)
        .order('ordem', { ascending: true });
      
      console.log('Produtos loaded:', data, 'Error:', error);
      if (!error && data) {
        setProdutos(data);
      } else {
        console.error('Error loading produtos:', error);
      }
    } catch (error) {
      console.error('Error loading produtos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load video aulas by produto - agora diretamente
  const loadVideoAulas = async (produtoId: string) => {
    setIsLoading(true);
    try {
      console.log('Loading video aulas for produto:', produtoId);
      
      const { data, error } = await supabase
        .from('video_aulas')
        .select('*')
        .eq('produto_id', produtoId)
        .order('ordem', { ascending: true });
      
      console.log('Video aulas loaded:', data, 'Error:', error);
      if (!error && data) {
        // Map the data to ensure id_video_bunny is never null
        const mappedVideoAulas = data.map(videoAula => ({
          ...videoAula,
          id_video_bunny: videoAula.id_video_bunny || ''
        }));
        setVideoAulas(mappedVideoAulas);
      } else {
        console.error('Error loading video aulas:', error);
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
