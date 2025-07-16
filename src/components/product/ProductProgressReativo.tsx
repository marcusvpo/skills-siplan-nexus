
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, BookOpen, RefreshCw } from 'lucide-react';
import { useProgressoSincronizado } from '@/hooks/useProgressoSincronizado';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface ProductProgressReativoProps {
  produtoId?: string;
  produtoNome: string;
}

export const ProductProgressReativo: React.FC<ProductProgressReativoProps> = ({ 
  produtoId, 
  produtoNome 
}) => {
  console.log('🟢 [ProductProgressReativo] Renderizado:', { produtoId, produtoNome });
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const { totalAulas, aulasCompletas, percentual, isLoading, error, forcarRefresh } = useProgressoSincronizado(produtoId, refreshKey);
  
  console.log('🟢 [ProductProgressReativo] Estado atual:', { 
    totalAulas, 
    aulasCompletas, 
    percentual, 
    isLoading, 
    error,
    isAuthenticated,
    authLoading
  });

  // ✅ LOADING STATE - aguardando autenticação completa
  if (!isAuthenticated || authLoading || isLoading || !produtoId) {
    return (
      <Card className="glass-effect border-gray-600/50 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">{produtoNome}</h3>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-600 rounded w-24 text-sm">
                {authLoading ? 'Autenticando...' : 'Carregando...'}
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gray-600 h-2 rounded-full animate-pulse" style={{ width: '30%' }}></div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {!isAuthenticated ? 'Aguardando autenticação...' : 'Sincronizando progresso...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-effect border-red-500/50 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-red-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">{produtoNome}</h3>
            </div>
            <span className="text-red-400 text-sm">Erro</span>
          </div>
          <p className="text-red-400 text-sm">{error}</p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => forcarRefresh()}
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-gray-600/50 hover:border-blue-500/50 transition-all duration-300 mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BookOpen className="h-5 w-5 text-blue-400 mr-2" />
            <h3 className="text-lg font-semibold text-white text-enhanced">{produtoNome}</h3>
          </div>
          <div className="flex items-center space-x-2">
            {percentual === 100 ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-400" />
            )}
            <span className="text-white font-medium">
              {aulasCompletas}/{totalAulas} aulas
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ease-out ${
              percentual === 100 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}
            style={{ width: `${percentual}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {percentual === 100 ? 'Produto concluído' : `${totalAulas - aulasCompletas} aulas restantes`}
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-white">
              {percentual}%
            </span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                console.log('🔄 [ProductProgressReativo] Refresh manual acionado');
                forcarRefresh();
              }}
              className="h-6 px-2 text-xs"
              title="Atualizar progresso"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
