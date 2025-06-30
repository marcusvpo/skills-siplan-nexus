
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  ChevronDown, 
  ChevronUp, 
  Database, 
  Network, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface DebugInfo {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  category: 'validation' | 'network' | 'database' | 'ui';
  message: string;
  data?: any;
}

interface VideoAulaDebugPanelProps {
  debugLogs: DebugInfo[];
  isVisible?: boolean;
  onToggle?: () => void;
}

export const VideoAulaDebugPanel: React.FC<VideoAulaDebugPanelProps> = ({
  debugLogs,
  isVisible = false,
  onToggle
}) => {
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  const toggleLogExpansion = (index: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLogs(newExpanded);
  };

  const getLevelIcon = (level: DebugInfo['level']) => {
    switch (level) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'info': return <Info className="h-4 w-4 text-blue-400" />;
      default: return <CheckCircle className="h-4 w-4 text-green-400" />;
    }
  };

  const getCategoryIcon = (category: DebugInfo['category']) => {
    switch (category) {
      case 'database': return <Database className="h-4 w-4" />;
      case 'network': return <Network className="h-4 w-4" />;
      case 'validation': return <CheckCircle className="h-4 w-4" />;
      case 'ui': return <Bug className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: DebugInfo['level']) => {
    switch (level) {
      case 'error': return 'bg-red-900/30 border-red-700';
      case 'warning': return 'bg-yellow-900/30 border-yellow-700';
      case 'info': return 'bg-blue-900/30 border-blue-700';
      default: return 'bg-gray-900/30 border-gray-700';
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="border-gray-600 text-gray-300 hover:bg-gray-700"
      >
        <Bug className="h-4 w-4 mr-2" />
        Mostrar Debug ({debugLogs.length})
      </Button>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bug className="h-5 w-5" />
            <span>Debug Panel</span>
            <Badge variant="outline" className="border-gray-600 text-gray-300">
              {debugLogs.length} logs
            </Badge>
          </div>
          <Button
            onClick={onToggle}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        <div className="space-y-3">
          {debugLogs.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              Nenhum log de debug disponível
            </p>
          ) : (
            debugLogs.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded border ${getLevelColor(log.level)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      {getLevelIcon(log.level)}
                      {getCategoryIcon(log.category)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className="text-xs border-gray-600 text-gray-300"
                        >
                          {log.category}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="text-xs border-gray-600 text-gray-300"
                        >
                          {log.level}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {log.timestamp}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-300">{log.message}</p>
                      
                      {log.data && (
                        <div className="mt-2">
                          <Button
                            onClick={() => toggleLogExpansion(index)}
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-400 hover:text-gray-300 p-0 h-auto"
                          >
                            {expandedLogs.has(index) ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Ocultar dados
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Mostrar dados
                              </>
                            )}
                          </Button>
                          
                          {expandedLogs.has(index) && (
                            <pre className="mt-2 p-2 bg-black/50 rounded text-xs text-gray-300 overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
