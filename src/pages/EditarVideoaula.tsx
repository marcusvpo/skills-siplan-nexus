import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { VideoAulaFormFixed } from '@/components/admin/VideoAulaFormFixed';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';

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
  id_video_bunny?: string;
  url_thumbnail?: string;
  ordem: number;
  produto_id: string;
}

const EditarVideoaula: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Get videoaula ID from URL params or search params
  const videoAulaId = id || searchParams.get('id');
  const sistemaId = searchParams.get('sistema_id');
  const produtoId = searchParams.get('produto_id');

  const [sistema, setSistema] = useState<Sistema | null>(null);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [videoAula, setVideoAula] = useState<VideoAula | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!videoAulaId) {
        setError('ID da videoaula é obrigatório');
        setIsLoading(false);
        return;
      }

      try {
        logger.info('📹 [EditarVideoaula] Loading data', {
          videoAulaId,
          sistemaId,
          produtoId
        });

        // Fetch videoaula first to get produto_id if not provided
        const { data: videoAulaData, error: videoAulaError } = await supabase
          .from('video_aulas')
          .select('*')
          .eq('id', videoAulaId)
          .single();

        if (videoAulaError) {
          logger.error('❌ [EditarVideoaula] Error loading videoaula:', { error: videoAulaError });
          throw new Error(`Erro ao carregar videoaula: ${videoAulaError.message}`);
        }

        setVideoAula(videoAulaData);
        const finalProdutoId = produtoId || videoAulaData.produto_id;

        if (finalProdutoId) {
          // Fetch produto
          const { data: produtoData, error: produtoError } = await supabase
            .from('produtos')
            .select('*')
            .eq('id', finalProdutoId)
            .single();

          if (produtoError) {
            logger.error('❌ [EditarVideoaula] Error loading produto:', { error: produtoError });
            throw new Error(`Erro ao carregar produto: ${produtoError.message}`);
          }

          setProduto(produtoData);
          const finalSistemaId = sistemaId || produtoData.sistema_id;

          // Fetch sistema
          const { data: sistemaData, error: sistemaError } = await supabase
            .from('sistemas')
            .select('*')
            .eq('id', finalSistemaId)
            .single();

          if (sistemaError) {
            logger.error('❌ [EditarVideoaula] Error loading sistema:', { error: sistemaError });
            throw new Error(`Erro ao carregar sistema: ${sistemaError.message}`);
          }

          setSistema(sistemaData);

          logger.info('✅ [EditarVideoaula] Data loaded successfully', {
            sistema: sistemaData.nome,
            produto: produtoData.nome,
            videoaula: videoAulaData.titulo
          });
        }
      } catch (err) {
        logger.error('❌ [EditarVideoaula] Unexpected error:', { error: err });
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [videoAulaId, sistemaId, produtoId]);

  const handleSuccess = () => {
    logger.info('✅ [EditarVideoaula] Videoaula updated successfully');
    
    // Navegar de volta para o admin
    navigate('/admin');
  };

  const handleCancel = () => {
    logger.info('ℹ️ [EditarVideoaula] User cancelled, navigating to admin');
    navigate('/admin');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-card/70 backdrop-blur-md border-border/50 rounded-2xl">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <span className="text-foreground">Carregando dados...</span>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !videoAula) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-card/70 backdrop-blur-md border-border/50 rounded-2xl">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">{error || 'Videoaula não encontrada'}</p>
              <Button
                onClick={() => navigate('/admin')}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Voltar ao Painel Admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <VideoAulaFormFixed 
          sistema={sistema}
          produto={produto}
          videoAula={videoAula}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </Layout>
  );
};

export default EditarVideoaula;
