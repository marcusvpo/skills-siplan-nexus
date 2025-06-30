
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBasicStats } from '@/hooks/useOptimizedQueries';
import { Activity, Clock, Database, RefreshCw, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const PerformanceMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { data: statsData, refetch, isLoading, error } = useBasicStats();

  const handleToggle = async () => {
    if (!isVisible) {
      const result = await refetch();
      if (result.error) {
        toast({
          title: "Erro ao carregar estatísticas",
          description: "Não foi possível carregar as estatísticas do sistema.",
          variant: "destructive",
        });
        return;
      }
    }
    setIsVisible(!isVisible);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-green-400" />
          <h3 className="text-lg font-medium text-white">Monitor do Sistema</h3>
        </div>
        <Button
          onClick={handleToggle}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <BarChart3 className="h-4 w-4 mr-2" />
          )}
          {isVisible ? 'Ocultar' : 'Mostrar'} Estatísticas
        </Button>
      </div>

      {isVisible && (
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Estatísticas do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-400">Carregando estatísticas...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-4">
                <p className="text-red-400">Erro ao carregar estatísticas</p>
              </div>
            )}

            {!isLoading && !error && statsData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-400">{statsData.sistemas}</div>
                  <div className="text-sm text-gray-400">Sistemas</div>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">{statsData.produtos}</div>
                  <div className="text-sm text-gray-400">Produtos</div>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-400">{statsData.videoaulas}</div>
                  <div className="text-sm text-gray-400">Videoaulas</div>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-400">{statsData.cartorios}</div>
                  <div className="text-sm text-gray-400">Cartórios</div>
                </div>
              </div>
            )}

            {!isLoading && !error && !statsData && (
              <div className="text-center py-4">
                <p className="text-gray-400">Nenhuma estatística disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
