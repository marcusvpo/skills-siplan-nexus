-- 1. Tipo de produto
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'produto_tipo') THEN
    CREATE TYPE public.produto_tipo AS ENUM ('treinamento', 'webinar');
  END IF;
END $$;

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS tipo public.produto_tipo NOT NULL DEFAULT 'treinamento';

-- 2. Campos de disponibilidade nas videoaulas (usados apenas por produtos webinar)
ALTER TABLE public.video_aulas
  ADD COLUMN IF NOT EXISTS disponivel_em timestamptz,
  ADD COLUMN IF NOT EXISTS dias_disponibilidade integer,
  ADD COLUMN IF NOT EXISTS disponivel_ate timestamptz,
  ADD COLUMN IF NOT EXISTS webinar_ativo boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_video_aulas_disponivel_ate
  ON public.video_aulas (disponivel_ate);

-- 3. Sistema Webinars + produtos iniciais
INSERT INTO public.sistemas (nome, descricao, ordem)
SELECT 'Webinars', 'Gravações dos webinars realizados ao vivo', 100
WHERE NOT EXISTS (SELECT 1 FROM public.sistemas WHERE nome = 'Webinars');

INSERT INTO public.produtos (sistema_id, nome, descricao, ordem, tipo)
SELECT s.id, v.nome, v.descricao, v.ordem, 'webinar'::public.produto_tipo
FROM public.sistemas s
CROSS JOIN (VALUES
  ('Orion PRO', 'Webinars do Orion PRO', 1),
  ('Orion TN', 'Webinars do Orion TN', 2),
  ('Orion REG', 'Webinars do Orion REG', 3)
) AS v(nome, descricao, ordem)
WHERE s.nome = 'Webinars'
  AND NOT EXISTS (
    SELECT 1 FROM public.produtos p
    WHERE p.sistema_id = s.id AND p.nome = v.nome
  );