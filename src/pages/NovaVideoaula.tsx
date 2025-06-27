
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { VideoAulaFormAdmin } from '@/components/admin/VideoAulaFormAdmin';
import { supabase } from '@/integrations/supabase/client';
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

const NovaVideoaula: React.FC = () => {
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
        // Fetch sistema
        const { data: sistemaData, error: sistemaError } = await supabase
          .from('sistemas')
          .select('*')
          .eq('id', sistemaId)
          .single();

        if (sistemaError) throw sistemaError;

        // Fetch produto
        const { data: produtoData, error: produtoError } = await supabase
          .from('produtos')
          .select('*')
          .eq('id', produtoId)
          .single();

        if (produtoError) throw produtoError;

        setSistema(sistemaData);
        setProduto(produtoData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Erro ao carregar dados do sistema e produto');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sistemaId, produtoId]);

  const handleSuccess = () => {
    navigate('/admin');
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-gray-800/50 border-gray-600">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-3" />
              <span className="text-white">Carregando...</span>
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
              <p className="text-red-400">{error || 'Sistema ou produto não encontrado'}</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <VideoAulaFormAdmin 
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
