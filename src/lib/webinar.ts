export type WebinarStatus = 'available' | 'scheduled' | 'expired' | 'inactive';

export interface WebinarWindowInput {
  disponivel_em?: string | null;
  dias_disponibilidade?: number | null;
  disponivel_ate?: string | null;
  webinar_ativo?: boolean | null;
}

export interface WebinarWindow {
  status: WebinarStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  msRemaining: number | null;
  /** true quando faltam 7 dias ou menos */
  endingSoon: boolean;
}

const DAY = 24 * 60 * 60 * 1000;

export const computeWebinarEnd = (input: WebinarWindowInput): Date | null => {
  if (input.disponivel_ate) return new Date(input.disponivel_ate);
  if (input.disponivel_em && input.dias_disponibilidade) {
    return new Date(new Date(input.disponivel_em).getTime() + input.dias_disponibilidade * DAY);
  }
  return null;
};

export const getWebinarWindow = (
  input: WebinarWindowInput,
  now: Date = new Date()
): WebinarWindow => {
  const startsAt = input.disponivel_em ? new Date(input.disponivel_em) : null;
  const endsAt = computeWebinarEnd(input);
  const msRemaining = endsAt ? endsAt.getTime() - now.getTime() : null;

  let status: WebinarStatus = 'available';
  if (input.webinar_ativo === false) {
    status = 'inactive';
  } else if (startsAt && startsAt.getTime() > now.getTime()) {
    status = 'scheduled';
  } else if (msRemaining !== null && msRemaining <= 0) {
    status = 'expired';
  }

  return {
    status,
    startsAt,
    endsAt,
    msRemaining,
    endingSoon: msRemaining !== null && msRemaining > 0 && msRemaining <= 7 * DAY,
  };
};

export const formatWebinarDate = (date: Date | string | null | undefined): string => {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const formatWebinarDateShort = (date: Date | string | null | undefined): string => {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** "12 dias", "3 dias e 4 h", "5 h 20 min" — sempre sem rodeios */
export const formatRemaining = (ms: number | null): string => {
  if (ms === null) return 'Sem prazo definido';
  if (ms <= 0) return 'Encerrado';

  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / 60000);

  if (days > 7) return `${days} dias`;
  if (days >= 1) return `${days} ${days === 1 ? 'dia' : 'dias'} e ${hours} h`;
  if (hours >= 1) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
};

export const isWebinarProduct = (produto?: { tipo?: string | null } | null): boolean =>
  produto?.tipo === 'webinar';
