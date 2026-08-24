import React from "react";
import { Circle } from "lucide-react";

interface CartorioStatusIndicatorProps {
  lastActivity: string | null;
}

// Janela "online em tempo real": 2 minutos (heartbeat a cada 60s)
const ONLINE_WINDOW_MS = 2 * 60 * 1000;
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

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
  const isOnline = elapsedMs >= 0 && elapsedMs < ONLINE_WINDOW_MS;

  const title = `Última atividade: ${lastActivityDate.toLocaleString('pt-BR')}`;
  const baseClasses = "flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs";

  // Verde: online em tempo real (< 2 min)
  if (isOnline) {
    return (
      <div className={baseClasses} title={title}>
        <Circle className="h-3 w-3 shrink-0 fill-success text-success animate-pulse" />
        <span className="text-success font-medium">Online</span>
      </div>
    );
  }

  // Vermelho: último acesso há mais de 2 semanas
  if (elapsedMs >= TWO_WEEKS_MS) {
    return (
      <div className={baseClasses} title={title}>
        <Circle className="h-3 w-3 shrink-0 fill-destructive text-destructive" />
        <span className="text-destructive">{formatTimeAgo(lastActivityDate)}</span>
      </div>
    );
  }

  // Laranja: entre 5 dias e 2 semanas
  if (elapsedMs >= FIVE_DAYS_MS) {
    return (
      <div className={baseClasses} title={title}>
        <Circle className="h-3 w-3 shrink-0 fill-warning text-warning" />
        <span className="text-warning">{formatTimeAgo(lastActivityDate)}</span>
      </div>
    );
  }

  // Azul: entre 1 minuto e 5 dias
  return (
    <div className={baseClasses} title={title}>
      <Circle className="h-3 w-3 shrink-0 fill-info text-info" />
      <span className="text-info">{formatTimeAgo(lastActivityDate)}</span>
    </div>
  );
};

