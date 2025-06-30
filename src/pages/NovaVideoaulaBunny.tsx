
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { VideoAulaFormWithBunny } from '@/components/admin/VideoAulaFormWithBunny';
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

const NovaVideoaulaBunny: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sistemaId = searchParams.get('sistema_id');
  const produtoId = searchParams.get('produto_id');

  const [sistema, setSistema] = useState<Sistema | null>(null);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!sistemaId || !produtoId) {
        setError('Sistema ID e Produto ID são obrigatórios');
        setIsLoading(false);
        return;
      }

      try {
        logger.info('📹 [NovaVideoaulaBunny] Loading sistema and produto data', {
          sistemaId,
          produtoId
        });

        // Fetch sistema
        const { data: sistemaData, error: sistemaError } = await supabase
          .from('sistemas')
          .select('*')
          .eq('id', sistemaId)
          .single();

        if (sistemaError) {
          logger.error('❌ [NovaVideoaulaBunny] Error loading sistema:', { error: sistemaError });
          throw new Error(`Erro ao carregar sistema: ${sistemaError.message}`);
        }

        // Fetch produto
        const { data: produtoData, error: produtoError } = await supabase
          .from('produtos')
          .select('*')
          .eq('id', produtoId)
          .single();

        if (produtoError) {
          logger.error('❌ [NovaVideoaulaBunny] Error loading produto:', { error: produtoError });
          throw new Error(`Erro ao carregar produto: ${produtoError.message}`);
        }

        setSistema(sistemaData);
        setProduto(produtoData);
        
        logger.info('✅ [NovaVideoaulaBunny] Data loaded successfully', {
          sistema: sistemaData.nome,
          produto: produtoData.nome
        });
      } catch (err) {
        logger.error('❌ [NovaVideoaulaBunny] Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados do sistema e produto');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sistemaId, produtoId]);

  const handleSuccess = () => {
    logger.info('✅ [NovaVideoaulaBunny] Videoaula created successfully, navigating to admin');
    navigate('/admin');
  };

  const handleCancel = () => {
    logger.info('ℹ️ [NovaVideoaulaBunny] User cancelled, navigating to admin');
    navigate('/admin');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-gray-800/50 border-gray-600">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-3" />
              <span className="text-white">Carregando dados...</span>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !sistema || !produto) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-gray-800/50 border-gray-600">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error || 'Sistema ou produto não encontrado'}</p>
              <Button
                onClick={() => navigate('/admin')}
                className="bg-red-600 hover:bg-red-700 text-white"
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
        <VideoAulaFormWithBunny 
          sistema={sistema}
          produto={produto}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </Layout>
  );
};

export default NovaVideoaulaBunny;
