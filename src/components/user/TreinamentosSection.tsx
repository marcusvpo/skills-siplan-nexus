
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { useSistemasCartorioWithAccess } from '@/hooks/useSupabaseDataWithAccess';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContextFixed';

export const TreinamentosSection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: sistemas = [], isLoading, error, refetch } = useSistemasCartorioWithAccess();

  React.useEffect(() => {
    logger.info('📚 [TreinamentosSection] Component state:', {
      categoriasCount: sistemas.length,
      isLoading,
      hasError: !!error,
      errorMessage: error?.message,
      userType: user?.type,
      cartorioId: user?.cartorio_id
    });
  }, [sistemas.length, isLoading, error, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    logger.error('❌ [TreinamentosSection] Error details:', { 
      error: error.message,
      stack: error.stack
    });
    
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="bg-gray-800/50 border-red-600 max-w-lg">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-400 mb-2">Erro ao carregar categorias</h3>
            <p className="text-gray-400 text-center mb-6">
              {error.message || 'Não foi possível carregar as categorias.'}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => refetch()}
                className="bg-red-600 hover:bg-red-700 text-white w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              <p className="text-xs text-gray-500">
                Se o problema persistir, contate o administrador
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sistemas.length === 0) {
    return (
      <div className="text-center py-16">
        <Card className="bg-gray-800/50 border-yellow-600 max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-6">📚</div>
            <h3 className="text-2xl font-semibold text-yellow-400 mb-3">Nenhuma categoria disponível</h3>
            <p className="text-gray-400 mb-6">
              As categorias aparecerão aqui quando estiverem disponíveis para seu cartório.
            </p>
            <p className="text-sm text-gray-500">
              Entre em contato com o administrador para mais informações.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <BookOpen className="h-6 w-6 mr-3 text-blue-400" />
            Categorias
          </h2>
          <p className="text-gray-400 mt-1">
            Selecione uma categoria para acessar seus produtos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sistemas.map((categoria) => {
          const totalProdutos = categoria.produtos?.length || 0;
          const totalVideoaulas = categoria.produtos?.reduce((acc, produto) => 
            acc + (produto.video_aulas?.length || 0), 0) || 0;

          return (
            <Card 
              key={categoria.id} 
              className="bg-gray-800/50 border-gray-600 hover:border-red-500/50 transition-all duration-300 cursor-pointer group hover:scale-105"
              onClick={() => navigate(`/system/${categoria.id}`)}
            >
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {categoria.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white group-hover:text-red-400 transition-colors">
                      {categoria.nome}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
                        {totalProdutos} produto(s)
                      </Badge>
                      <Badge variant="secondary" className="bg-green-600/20 text-green-300">
                        {totalVideoaulas} videoaula(s)
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {categoria.descricao && (
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {categoria.descricao}
                  </p>
                )}
              </CardHeader>
              
              <CardContent>
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 transition-all duration-200 group-hover:scale-105"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/system/${categoria.id}`);
                  }}
                >
                  Acessar Categoria
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
