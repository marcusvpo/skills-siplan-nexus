import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  percentual: number;
  total: number;
  completas: number;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  showStats?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percentual,
  total,
  completas,
  size = 'medium',
  showText = true,
  showStats = true,
  className
}) => {
  const sizeClasses = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4'
  };

  const getProgressColor = () => {
    if (percentual <= 30) return 'text-destructive';
    if (percentual <= 70) return 'text-primary';
    return 'text-success';
  };

  const getProgressMessage = () => {
    if (percentual === 100) return 'Curso concluído!';
    if (percentual >= 70) return 'Quase lá!';
    if (percentual >= 30) return 'Bom progresso!';
    return 'Começando...';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showText && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">
            {getProgressMessage()}
          </span>
          <span className={cn('text-sm font-bold', getProgressColor())}>
            {percentual}%
          </span>
        </div>
      )}
      
      <Progress 
        value={percentual} 
        className={cn(sizeClasses[size], 'transition-all duration-500 ease-out')}
      />
      
      {showStats && (
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{completas} de {total} aulas concluídas</span>
          {total - completas > 0 && (
            <span>{total - completas} restantes</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
