CREATE TABLE public.produto_manuais (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_produto_manuais_produto_id ON public.produto_manuais(produto_id);

GRANT SELECT ON public.produto_manuais TO anon;
GRANT SELECT ON public.produto_manuais TO authenticated;
GRANT ALL ON public.produto_manuais TO service_role;

ALTER TABLE public.produto_manuais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manuais visiveis para todos"
ON public.produto_manuais FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Somente service role gerencia manuais"
ON public.produto_manuais FOR ALL
TO service_role
USING (true) WITH CHECK (true);

CREATE TRIGGER update_produto_manuais_updated_at
BEFORE UPDATE ON public.produto_manuais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Leitura publica manuais storage"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'manuais');

CREATE POLICY "Service role gerencia manuais storage"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'manuais') WITH CHECK (bucket_id = 'manuais');