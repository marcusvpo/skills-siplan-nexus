
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useSistemasCartorio } from '@/hooks/useSupabaseDataSimplified';
import { logger } from '@/utils/logger';

export const TreinamentosSection: React.FC = () => {
  const navigate = useNavigate();
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando treinamentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    logger.error('❌ [TreinamentosSection] Error:', error);
    
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Erro ao carregar treinamentos</h3>
          <p className="text-gray-400 text-center mb-4">
            Não foi possível carregar os sistemas de treinamento.
          </p>
          <Button
            onClick={() => refetch()}
            className="bg-red-600 hover:bg-red-700 text-white"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Sistemas de Treinamento</h2>
          <p className="text-gray-400">
            {sistemas.length} sistema(s) disponível(is)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sistemas.map((sistema) => (
          <Card key={sistema.id} className="bg-gray-800/50 border-gray-600 hover:border-red-500/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>{sistema.nome}</span>
                <Badge variant="secondary" className="bg-red-600/20 text-red-400">
                  {sistema.produtos?.length || 0} produto(s)
                </Badge>
              </CardTitle>
              {sistema.descricao && (
                <p className="text-gray-400 text-sm">{sistema.descricao}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sistema.produtos && sistema.produtos.length > 0 ? (
                  <>
                    <div className="text-sm text-gray-400 mb-2">Produtos disponíveis:</div>
                    {sistema.produtos.slice(0, 3).map((produto) => (
                      <div key={produto.id} className="border border-gray-600 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">{produto.nome}</h4>
                          <Badge variant="outline" className="border-gray-500 text-gray-300">
                            {produto.video_aulas?.length || 0} aula(s)
                          </Badge>
                        </div>
                        
                        {produto.descricao && (
                          <p className="text-gray-400 text-xs mb-3">{produto.descricao}</p>
                        )}

                        <Button 
                          size="sm" 
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => navigate(`/system/${sistema.id}/product/${produto.id}`)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Acessar Produto
                        </Button>
                      </div>
                    ))}
                    
                    {sistema.produtos.length > 3 && (
                      <div className="text-center">
                        <span className="text-gray-500 text-xs">
                          +{sistema.produtos.length - 3} produtos mais
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-6 w-6 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">Nenhum produto disponível</p>
                  </div>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 mt-2"
                  onClick={() => navigate(`/system/${sistema.id}`)}
                >
                  Ver Sistema
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
