import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, BookOpen, RefreshCw } from 'lucide-react';
import { useProgressoReativo } from '@/hooks/useProgressoReativo'; // Atualizado
import { Button } from '@/components/ui/button';

interface ProductProgressReativoProps {
  produtoId?: string; // Note: deve ser videoId para uso correto do hook atualmente
  produtoNome: string;
}

export const ProductProgressReativo: React.FC<ProductProgressReativoProps> = ({
  produtoId,
  produtoNome
}) => {
  console.log('🟢 [ProductProgressReativo] Componente renderizado:', { produtoId, produtoNome });

  // Como o hook espera um videoId, aqui deverá ser adaptado para um só (ou alterar o hook)
  // Para múltiplos vídeo aulas, crie um hook específico ou outro componente.

  // Aqui vamos usar produtoId como videoId direto para demo.
  const { totalAulas, aulasCompletas, percentual, isLoading, error } = useProgressoReativo(produtoId);

  console.log('🟢 [ProductProgressReativo] Hook retornou:', {
    totalAulas,
    aulasCompletas,
    percentual,
    isLoading,
    error
  });

  if (isLoading || !produtoId) {
    return (
      <Card className="glass-effect border-gray-600/50 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">{produtoNome}</h3>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-600 rounded w-24 text-sm">Carregando...</div>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gray-600 h-2 rounded-full animate-pulse" style={{ width: '30%' }} />
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {!produtoId ? 'Aguardando produto...' : 'Aguardando autenticação completa...'}
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
