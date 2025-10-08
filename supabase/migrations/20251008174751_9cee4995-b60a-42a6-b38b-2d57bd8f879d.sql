-- Tabela para rastrear sessões ativas de cartórios
CREATE TABLE IF NOT EXISTS public.cartorio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cartorio_id UUID NOT NULL REFERENCES public.cartorios(id) ON DELETE CASCADE,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cartorio_id)
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_cartorio_sessions_cartorio_id ON public.cartorio_sessions(cartorio_id);
CREATE INDEX IF NOT EXISTS idx_cartorio_sessions_active ON public.cartorio_sessions(is_active, last_activity);

-- RLS Policies
ALTER TABLE public.cartorio_sessions ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as sessões
CREATE POLICY "Admins view all sessions"
ON public.cartorio_sessions
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Cartórios podem ver e atualizar apenas sua própria sessão
CREATE POLICY "Cartorios manage own session"
ON public.cartorio_sessions
FOR ALL
TO authenticated
USING (cartorio_id = public.get_current_cartorio_id_from_jwt())
WITH CHECK (cartorio_id = public.get_current_cartorio_id_from_jwt());

-- Função para atualizar sessão (upsert)
CREATE OR REPLACE FUNCTION public.upsert_cartorio_session(p_cartorio_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.cartorio_sessions (cartorio_id, last_activity, is_active)
  VALUES (p_cartorio_id, now(), true)
  ON CONFLICT (cartorio_id)
  DO UPDATE SET
    last_activity = now(),
    is_active = true;
END;
$$;

-- Função para marcar sessão como inativa
CREATE OR REPLACE FUNCTION public.deactivate_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.cartorio_sessions
  SET is_active = false
  WHERE last_activity < (now() - interval '2 minutes')
  AND is_active = true;
END;
$$;

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cartorio_sessions;