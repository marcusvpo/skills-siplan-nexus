import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Bug, Eye } from 'lucide-react';
import { useProgressoGeral } from '@/hooks/useProgressoGeral';
import { useAuth } from '@/contexts/AuthContext';
import { useProgressContext } from '@/contexts/ProgressContext';

export const ProgressDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();
  const { progressos, isLoading, refetch } = useProgressoGeral();
  const { refreshAll, refreshKey } = useProgressContext();

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug Progress
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-gray-900/95 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center justify-between">
            <span>Debug - Progresso em Tempo Real</span>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  refreshAll();
                  refetch();
                }}
                size="sm"
                variant="outline"
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="outline"
                className="h-6 w-6 p-0"
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-gray-400">
            <p>Cartório: {user?.cartorio_id?.substring(0, 8)}...</p>
            <p>Refresh Key: {refreshKey}</p>
            <p>Loading: {isLoading ? 'Sim' : 'Não'}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Progresso por Produto:</p>
            {Object.entries(progressos).length === 0 ? (
              <p className="text-xs text-gray-500">Nenhum progresso encontrado</p>
            ) : (
              Object.entries(progressos).map(([produtoId, progresso]) => (
                <div key={produtoId} className="bg-gray-800/50 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-300">
                      {produtoId.substring(0, 8)}...
                    </span>
                    <Badge variant={progresso.percentual > 0 ? 'default' : 'secondary'}>
                      {progresso.percentual}%
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">
                    {progresso.completas}/{progresso.total} concluídas
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                    <div
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${progresso.percentual}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-xs text-gray-500">
            Última atualização: {new Date().toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};