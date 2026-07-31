import React from "react";
import { Circle } from "lucide-react";

interface CartorioStatusIndicatorProps {
  lastActivity: string | null;
}

const ONLINE_WINDOW_MS = 2 * 60 * 1000; // 2 minutos (heartbeat = 60s)

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "há segundos";
  if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
  if (diffInHours < 24) return `há ${diffInHours} h`;
  return `há ${diffInDays} ${diffInDays === 1 ? "dia" : "dias"}`;
};

export const CartorioStatusIndicator: React.FC<CartorioStatusIndicatorProps> = ({ lastActivity }) => {
  if (!lastActivity) {
    return (
      <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
        <Circle className="h-3 w-3 shrink-0 fill-muted-foreground/60 text-muted-foreground/60" />
        <span>Nunca acessou</span>
      </div>
    );
  }

  const lastActivityDate = new Date(lastActivity);
  const elapsedMs = Date.now() - lastActivityDate.getTime();
  const daysSinceLastActivity = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const isOnline = elapsedMs >= 0 && elapsedMs < ONLINE_WINDOW_MS;

  // Online (success)
  if (isOnline) {
    return (
      <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs" title={`Última atividade: ${lastActivityDate.toLocaleString('pt-BR')}`}>
        <Circle className="h-3 w-3 shrink-0 fill-success text-success animate-pulse" />
        <span className="text-success font-medium">Online</span>
      </div>
    );
  }

  // Offline recente (atenção) - menos de 5 dias
  if (daysSinceLastActivity < 5) {
    return (
      <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs" title={`Última atividade: ${lastActivityDate.toLocaleString('pt-BR')}`}>
        <Circle className="h-3 w-3 shrink-0 fill-primary text-primary" />
        <span className="text-primary">{formatTimeAgo(lastActivityDate)}</span>
      </div>
    );
  }

  // Offline há muito tempo (destructive) - 5+ dias
  return (
    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs" title={`Última atividade: ${lastActivityDate.toLocaleString('pt-BR')}`}>
      <Circle className="h-3 w-3 shrink-0 fill-destructive text-destructive" />
      <span className="text-destructive">{formatTimeAgo(lastActivityDate)}</span>
    </div>
  );
};
