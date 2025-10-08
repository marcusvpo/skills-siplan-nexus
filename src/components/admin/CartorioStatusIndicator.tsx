import React from 'react';
import { Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CartorioStatusIndicatorProps {
  lastActivity: string | null;
  isActive: boolean;
}

export const CartorioStatusIndicator: React.FC<CartorioStatusIndicatorProps> = ({
  lastActivity,
  isActive
}) => {
  if (!lastActivity) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Circle className="h-3 w-3 fill-gray-400 text-gray-400" />
        <span>Sem atividade registrada</span>
      </div>
    );
  }

  const lastActivityDate = new Date(lastActivity);
  const daysSinceLastActivity = Math.floor(
    (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Online (verde)
  if (isActive) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Circle className="h-3 w-3 fill-green-500 text-green-500 animate-pulse" />
        <span className="text-green-600 dark:text-green-400 font-medium">Online</span>
      </div>
    );
  }

  // Offline recente (amarelo) - menos de 5 dias
  if (daysSinceLastActivity < 5) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />
        <span className="text-yellow-600 dark:text-yellow-400">
          {formatDistanceToNow(lastActivityDate, {
            addSuffix: true,
            locale: ptBR
          })}
        </span>
      </div>
    );
  }

  // Offline há muito tempo (vermelho) - 5+ dias
  return (
    <div className="flex items-center gap-2 text-xs">
      <Circle className="h-3 w-3 fill-red-500 text-red-500" />
      <span className="text-red-600 dark:text-red-400">
        {formatDistanceToNow(lastActivityDate, {
          addSuffix: true,
          locale: ptBR
        })}
      </span>
    </div>
  );
};
