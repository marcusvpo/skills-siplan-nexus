
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useProgressTracker } from '@/hooks/useProgressTracker';

interface ProgressTrackerProps {
  videoAulaId: string;
  progressoSegundos?: number;
  completo?: boolean;
  onProgressUpdate?: (progress: { progressoSegundos: number; completo: boolean }) => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  videoAulaId,
  progressoSegundos = 0,
  completo = false,
  onProgressUpdate
}) => {
  const { markAsComplete, isLoading } = useProgressTracker({
    videoAulaId,
    progressoSegundos,
    completo,
    onProgressUpdate
  });

  if (completo) {
    return (
      <div className="flex items-center space-x-2 text-green-400">
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm">Concluída</span>
      </div>
    );
  }

  return (
    <Button
      onClick={markAsComplete}
      disabled={isLoading}
      size="sm"
      className="bg-green-600 hover:bg-green-700"
    >
      {isLoading ? 'Salvando...' : 'Marcar como Concluída'}
    </Button>
  );
};
