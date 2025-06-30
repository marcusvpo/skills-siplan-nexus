
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { VideoAulaFormFixed } from '@/components/admin/VideoAulaFormFixed';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';
import { useQueryInvalidation } from '@/hooks/useQueryInvalidation';

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

const NovaVideoaula: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { invalidateVideoAulaQueries } = useQueryInvalidation();
  
  const sistemaId = searchParams.get('sistema_id');
  const produtoId = searchParams.get('produto_id');

  const [sistema, setSistema] = useState<Sistema | null>(null);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!sistemaId || !produtoId) {
        logger.error('📹 [NovaVideoaula] Missing required IDs', { sistemaId, produtoId });
        setError('Sistema ID e Produto ID são obrigatórios');
        setIsLoading(false);
        return;
      }

      try {
        logger.info('📹 [NovaVideoaula] Loading sistema and produto data', {
          sistemaId,
          produtoId
        });

        // Usar consulta otimizada para carregar dados relacionados
        const [sistemaResult, produtoResult] = await Promise.all([
          supabase
            .from('sistemas')
            .select('*')
            .eq('id', sistemaId)
            .single(),
          
          supabase
            .from('produtos')
            .select('*')
            .eq('id', produtoId)
            .single()
        ]);

        if (sistemaResult.error) {
          logger.error('❌ [NovaVideoaula] Error loading sistema:', { error: sistemaResult.error });
          throw new Error(`Erro ao carregar sistema: ${sistemaResult.error.message}`);
        }

        if (produtoResult.error) {
          logger.error('❌ [NovaVideoaula] Error loading produto:', { error: produtoResult.error });
          throw new Error(`Erro ao carregar produto: ${produtoResult.error.message}`);
        }

        if (!sistemaResult.data) {
          throw new Error('Sistema não encontrado');
        }

        if (!produtoResult.data) {
          throw new Error('Produto não encontrado');
        }

        setSistema(sistemaResult.data);
        setProduto(produtoResult.data);
        
        logger.info('✅ [NovaVideoaula] Data loaded successfully', {
          sistema: sistemaResult.data.nome,
          produto: produtoResult.data.nome
        });
      } catch (err) {
        logger.error('❌ [NovaVideoaula] Unexpected error:', { error: err });
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados do sistema e produto');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sistemaId, produtoId]);

  const handleSuccess = () => {
    logger.info('✅ [NovaVideoaula] Videoaula created successfully');
    
    // Invalidar queries para garantir atualização imediata
    if (produtoId) {
      invalidateVideoAulaQueries(produtoId);
    }
    
    // Navegar de volta para o admin
    navigate('/admin');
  };

  const handleCancel = () => {
    logger.info('ℹ️ [NovaVideoaula] User cancelled, navigating to admin');
    navigate('/admin');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-gray-800/50 border-gray-600">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-red-500 mr-3" />
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
        <VideoAulaFormFixed 
          sistema={sistema}
          produto={produto}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </Layout>
  );
};

export default NovaVideoaula;
