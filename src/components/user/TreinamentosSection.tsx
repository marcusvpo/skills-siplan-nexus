
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useSistemasCartorio } from '@/hooks/useSupabaseDataFixed';
import { logger } from '@/utils/logger';

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  ordem: number;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  video_aulas: VideoAula[];
}

interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  produtos: Produto[];
}

export const TreinamentosSection: React.FC = () => {
  const { data: sistemas = [], isLoading, error, refetch } = useSistemasCartorio();

  React.useEffect(() => {
    logger.info('📚 [TreinamentosSection] Component mounted', {
      sistemasCount: sistemas.length,
      isLoading,
      hasError: !!error
    });
  }, [sistemas.length, isLoading, error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando treinamentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    logger.error('❌ [TreinamentosSection] Error loading treinamentos:', { error });
    
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Erro ao carregar treinamentos</h3>
          <p className="text-gray-400 text-center mb-4">
            Não foi possível carregar os sistemas de treinamento. Verifique sua conexão.
          </p>
          <Button
            onClick={() => refetch()}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (sistemas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">Nenhum treinamento disponível</div>
        <p className="text-gray-500 text-sm">
          Os treinamentos aparecerão aqui quando estiverem disponíveis para seu cartório.
        </p>
      </div>
    );
  }

  const totalVideoAulas = sistemas.reduce(
    (total, sistema) => 
      total + sistema.produtos.reduce(
        (prodTotal, produto) => prodTotal + produto.video_aulas.length, 
        0
      ), 
    0
  );

  logger.info('✅ [TreinamentosSection] Displaying treinamentos', {
    sistemasCount: sistemas.length,
    totalVideoAulas
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Meus Treinamentos</h2>
          <p className="text-gray-400">
            {sistemas.length} sistema(s) disponível(is) • {totalVideoAulas} videoaula(s) total
          </p>
        </div>
      </div>

      {/* Sistemas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sistemas.map((sistema) => (
          <Card key={sistema.id} className="bg-gray-800/50 border-gray-600 hover:border-orange-500/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>{sistema.nome}</span>
                <Badge variant="secondary" className="bg-orange-600/20 text-orange-400">
                  {sistema.produtos.length} produto(s)
                </Badge>
              </CardTitle>
              {sistema.descricao && (
                <p className="text-gray-400 text-sm">{sistema.descricao}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sistema.produtos.map((produto) => (
                  <div key={produto.id} className="border border-gray-600 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{produto.nome}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="border-gray-500 text-gray-300">
                          {produto.video_aulas.length} aula(s)
                        </Badge>
                      </div>
                    </div>
                    
                    {produto.descricao && (
                      <p className="text-gray-400 text-xs mb-3">{produto.descricao}</p>
                    )}

                    {produto.video_aulas.length > 0 ? (
                      <div className="space-y-2">
                        {produto.video_aulas
                          .sort((a, b) => a.ordem - b.ordem)
                          .slice(0, 3) // Mostrar apenas as 3 primeiras
                          .map((videoAula) => (
                            <div key={videoAula.id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                              <div className="flex items-center space-x-2">
                                <Play className="h-3 w-3 text-orange-400" />
                                <span className="text-gray-300 text-xs truncate">
                                  {videoAula.titulo}
                                </span>
                              </div>
                              <Clock className="h-3 w-3 text-gray-500" />
                            </div>
                          ))}
                        
                        {produto.video_aulas.length > 3 && (
                          <div className="text-center">
                            <span className="text-gray-500 text-xs">
                              +{produto.video_aulas.length - 3} mais
                            </span>
                          </div>
                        )}

                        <Button 
                          size="sm" 
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white mt-2"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Começar Treinamento
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="h-6 w-6 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-500 text-xs">Nenhuma videoaula disponível</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
