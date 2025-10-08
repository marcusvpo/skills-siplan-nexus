import React from 'react';
import { Circle } from 'lucide-react';

interface CartorioStatusIndicatorProps {
  lastActivity: string | null;
  isActive: boolean;
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'agora há pouco';
  if (diffInMinutes < 60) return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  if (diffInHours < 24) return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  return `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
};

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
          {formatTimeAgo(lastActivityDate)}
        </span>
      </div>
    );
  }

  // Offline há muito tempo (vermelho) - 5+ dias
  return (
    <div className="flex items-center gap-2 text-xs">
      <Circle className="h-3 w-3 fill-red-500 text-red-500" />
      <span className="text-red-600 dark:text-red-400">
        {formatTimeAgo(lastActivityDate)}
      </span>
    </div>
  );
};
