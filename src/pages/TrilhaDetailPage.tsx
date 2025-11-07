import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, CheckCircle2, Circle } from 'lucide-react';
import LoadingState from '@/components/system/LoadingState';
import ErrorState from '@/components/system/ErrorState';
import { logger } from '@/utils/logger';

export const TrilhaDetailPage = () => {
  const { systemId, productId, trilhaId } = useParams<{
    systemId: string;
    productId: string;
    trilhaId: string;
  }>();
  const navigate = useNavigate();

  const { data: trilhaData, isLoading, error } = useQuery({
    queryKey: ['trilha-detail', trilhaId],
    queryFn: async () => {
      logger.info('🎯 [TrilhaDetailPage] Fetching trilha data', { trilhaId });
      
      const { data, error } = await supabase
        .from('trilhas')
        .select(`
          *,
          produtos (
            id,
            nome,
            sistemas (
              id,
              nome
            )
          ),
          trilha_aulas (
            ordem,
            video_aulas (
              id,
              titulo,
              descricao,
              ordem,
              id_video_bunny,
              url_thumbnail
            )
          )
        `)
        .eq('id', trilhaId)
        .single();
      
      if (error) throw error;
      
      // Ordenar aulas por ordem
      if (data.trilha_aulas) {
        data.trilha_aulas.sort((a, b) => a.ordem - b.ordem);
      }
      
      logger.info('✅ [TrilhaDetailPage] Trilha data loaded', {
        trilhaNome: data.nome,
        aulasCount: data.trilha_aulas?.length || 0
      });
      
      return data;
    },
    enabled: !!trilhaId,
  });

  if (isLoading) {
    return <LoadingState message="Carregando trilha..." />;
  }

  if (error || !trilhaData) {
    return (
      <ErrorState 
        title="Erro ao carregar trilha"
        message="Não foi possível carregar os dados da trilha."
        onRetry={() => navigate(`/system/${systemId}/product/${productId}`)}
      />
    );
  }

  const produto = trilhaData.produtos as any;
  const sistema = produto?.sistemas as any;
  const aulas = trilhaData.trilha_aulas || [];

  return (
    <Layout>
      <div className="min-h-screen page-transition">
        <div className="container mx-auto px-6 py-8">
          <Breadcrumbs items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: sistema?.nome || 'Sistema', href: `/system/${systemId}` },
            { label: produto?.nome || 'Produto', href: `/system/${systemId}/product/${productId}` },
            { label: trilhaData.nome }
          ]} />

          <div className="mt-6 space-y-6">
            {/* Header */}
            <Card className="gradient-card border-gray-600/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="secondary" className="bg-primary/20 text-primary">
                        Trilha de Aprendizagem
                      </Badge>
                      <Badge variant="outline" className="border-gray-600">
                        {aulas.length} aulas
                      </Badge>
                    </div>
                    <CardTitle className="text-3xl font-bold text-white text-enhanced mb-2">
                      {trilhaData.nome}
                    </CardTitle>
                    <p className="text-gray-400">
                      {produto?.nome} • {sistema?.nome}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/system/${systemId}/product/${productId}`)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao Produto
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Lista de Aulas */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white text-enhanced">
                Aulas da Trilha
              </h3>
              
              {aulas.length === 0 ? (
                <Card className="gradient-card border-gray-600/50">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-400">
                      Esta trilha ainda não possui aulas cadastradas.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {aulas.map((aulaItem, index) => {
                    const aula = aulaItem.video_aulas;
                    if (!aula) return null;

                    return (
                      <Card
                        key={aula.id}
                        className="gradient-card border-gray-600/50 hover:border-primary/50 transition-all cursor-pointer btn-hover-lift"
                        onClick={() => navigate(`/system/${systemId}/product/${productId}/lesson/${aula.id}`)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Número da aula */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-primary font-bold">
                                {index + 1}
                              </span>
                            </div>

                            {/* Thumbnail */}
                            {aula.url_thumbnail && (
                              <div className="flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-gray-800">
                                <img 
                                  src={aula.url_thumbnail} 
                                  alt={aula.titulo}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            {/* Conteúdo */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-semibold text-white text-enhanced mb-1">
                                {aula.titulo}
                              </h4>
                              {aula.descricao && (
                                <p className="text-gray-400 text-sm line-clamp-2">
                                  {aula.descricao}
                                </p>
                              )}
                            </div>

                            {/* Botão de ação */}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/system/${systemId}/product/${productId}/lesson/${aula.id}`);
                              }}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Assistir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TrilhaDetailPage;
