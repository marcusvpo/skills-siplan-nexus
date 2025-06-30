
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePerformanceMonitoring } from '@/hooks/useOptimizedQueries';
import { Activity, Clock, Database, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const PerformanceMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { data: performanceData, refetch, isLoading, error } = usePerformanceMonitoring();

  const handleToggle = async () => {
    if (!isVisible) {
      const result = await refetch();
      if (result.error) {
        toast({
          title: "Monitoramento não disponível",
          description: "A funcionalidade de monitoramento de performance não está ativada.",
          variant: "default",
        });
        return;
      }
    }
    setIsVisible(!isVisible);
  };

  const formatTime = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-green-400" />
          <h3 className="text-lg font-medium text-white">Monitor de Performance</h3>
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
            <Database className="h-4 w-4 mr-2" />
          )}
          {isVisible ? 'Ocultar' : 'Mostrar'} Performance
        </Button>
      </div>

      {isVisible && (
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Queries Mais Demoradas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-400">Carregando dados de performance...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-4">
                <p className="text-red-400">Erro ao carregar dados de performance</p>
              </div>
            )}

            {!isLoading && !error && !performanceData && (
              <div className="text-center py-4">
                <p className="text-gray-400">Monitoramento de performance não disponível</p>
                <p className="text-xs text-gray-500 mt-1">
                  A extensão pg_stat_monitor não está ativada
                </p>
              </div>
            )}

            {performanceData && performanceData.length > 0 && (
              <div className="space-y-3">
                {performanceData.slice(0, 10).map((query: any, index: number) => (
                  <div key={index} className="bg-gray-700/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-gray-300 truncate max-w-md">
                        {query.query_texto}
                      </span>
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="text-yellow-400">
                          {query.chamadas} execuções
                        </span>
                        <span className="text-red-400">
                          {formatTime(query.tempo_medio_ms)} médio
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs text-gray-400">
                      <div>
                        <span className="font-medium">Tempo Total:</span> {formatTime(query.tempo_total_ms)}
                      </div>
                      <div>
                        <span className="font-medium">Por Execução:</span> {formatTime(query.tempo_execucao_ms)}
                      </div>
                      <div>
                        <span className="font-medium">Chamadas:</span> {query.chamadas}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
