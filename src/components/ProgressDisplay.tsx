
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ProgressDisplayProps {
  progressSegundos: number;
  duracaoSegundos: number;
  completo: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  progressSegundos,
  duracaoSegundos,
  completo,
  size = 'md'
}) => {
  const percentage = duracaoSegundos > 0 ? Math.round((progressSegundos / duracaoSegundos) * 100) : 0;
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressHeight = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-2';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className={`${textSize} text-gray-300`}>
          Progresso: {formatTime(progressSegundos)} / {formatTime(duracaoSegundos)}
        </span>
        <div className="flex items-center space-x-2">
          <span className={`${textSize} text-gray-300`}>{percentage}%</span>
          <Badge 
            variant={completo ? 'secondary' : 'outline'}
            className={`${textSize} ${completo ? 'bg-green-600 text-white' : 'border-yellow-500 text-yellow-500'}`}
          >
            {completo ? 'Concluído' : 'Em Progresso'}
          </Badge>
        </div>
      </div>
      <Progress value={percentage} className={progressHeight} />
    </div>
  );
};

export default ProgressDisplay;
