
import React, { useState, useEffect } from 'react';
import { SystemsList } from './SystemsList';
import { ProductsList } from './ProductsList';
import { VideoAulasListFixed } from './VideoAulasListFixed';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

export const ContentManagerComplete: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('sistemas');
  const [selectedSistema, setSelectedSistema] = useState<Sistema | null>(null);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [videoAulas, setVideoAulas] = useState<VideoAula[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);

  // Load sistemas with improved error handling
  const loadSistemas = async () => {
    setIsLoading(true);
    try {
      console.log('Loading sistemas for content manager...');
      const { data, error } = await supabase
        .from('sistemas')
        .select('*')
        .order('ordem', { ascending: true });
      
      console.log('Sistemas query result:', { data, error });
      
      if (error) {
        console.error('Error loading sistemas:', error);
        toast({
          title: "Erro ao carregar sistemas",
          description: `Erro: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      if (!data) {
        console.log('No sistemas data returned');
        setSistemas([]);
        return;
      }
      
      console.log('Sistemas loaded successfully:', data);
      setSistemas(data);
    } catch (error) {
      console.error('Exception loading sistemas:', error);
      toast({
        title: "Erro ao carregar sistemas",
        description: "Ocorreu um erro inesperado ao carregar os sistemas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load produtos by sistema with improved debugging
  const loadProdutos = async (sistemaId: string) => {
    setIsLoading(true);
    try {
      console.log('Loading produtos for sistema:', sistemaId);
      
      // First, let's verify if the sistema exists
      const { data: sistemaCheck, error: sistemaError } = await supabase
        .from('sistemas')
        .select('id, nome')
        .eq('id', sistemaId)
        .single();
      
      console.log('Sistema verification:', { sistemaCheck, sistemaError });
      
      // Now load produtos with detailed logging
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('sistema_id', sistemaId)
        .order('ordem', { ascending: true });
      
      console.log('Produtos query result:', { data, error, sistemaId });
      console.log('Raw SQL would be: SELECT * FROM produtos WHERE sistema_id =', sistemaId);
      
      if (error) {
        console.error('Error loading produtos:', error);
        toast({
          title: "Erro ao carregar produtos",
          description: `Erro: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      // Log detailed information about the result
      console.log('Produtos loaded successfully:', data);
      console.log('Number of produtos found:', data?.length || 0);
      
      if (data && data.length === 0) {
        console.warn('No produtos found for sistema:', sistemaId);
        toast({
          title: "Nenhum produto encontrado",
          description: `Não foram encontrados produtos para o sistema selecionado.`,
          variant: "default",
        });
      }
      
      setProdutos(data || []);
    } catch (error) {
      console.error('Exception loading produtos:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Ocorreu um erro inesperado ao carregar os produtos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load video aulas by produto
  const loadVideoAulas = async (produtoId: string) => {
    setIsLoading(true);
    try {
      console.log('Loading video aulas for produto:', produtoId);
      
      const { data, error } = await supabase
        .from('video_aulas')
        .select('*')
        .eq('produto_id', produtoId)
        .order('ordem', { ascending: true });
      
      console.log('Video aulas query result:', { data, error });
      
      if (error) {
        console.error('Error loading video aulas:', error);
        toast({
          title: "Erro ao carregar videoaulas",
          description: `Erro: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      if (!data) {
        console.log('No video aulas data returned');
        setVideoAulas([]);
        return;
      }
      
      // Map the data to ensure id_video_bunny is never null
      const mappedVideoAulas = data.map(videoAula => ({
        ...videoAula,
        id_video_bunny: videoAula.id_video_bunny || ''
      }));
      
      console.log('Video aulas loaded successfully:', mappedVideoAulas);
      setVideoAulas(mappedVideoAulas);
    } catch (error) {
      console.error('Exception loading video aulas:', error);
      toast({
        title: "Erro ao carregar videoaulas",
        description: "Ocorreu um erro inesperado ao carregar as videoaulas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('ContentManagerComplete mounted, loading sistemas...');
    loadSistemas();
  }, []);

  const handleSelectSistema = (sistema: Sistema) => {
    console.log('Selected sistema:', sistema);
    setSelectedSistema(sistema);
    setViewMode('produtos');
    loadProdutos(sistema.id);
  };

  const handleSelectProduto = (produto: Produto) => {
    console.log('Selected produto:', produto);
    setSelectedProduto(produto);
    setViewMode('videoaulas');
    loadVideoAulas(produto.id);
  };

  const handleBackToSistemas = () => {
    console.log('Going back to sistemas');
    setViewMode('sistemas');
    setSelectedSistema(null);
    setSelectedProduto(null);
    loadSistemas();
  };

  const handleBackToProdutos = () => {
    console.log('Going back to produtos');
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
      <VideoAulasListFixed
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
