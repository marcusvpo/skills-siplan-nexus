
-- 1. Verificar a estrutura atual e adicionar produto_id se não existir
ALTER TABLE public.video_aulas 
ADD COLUMN IF NOT EXISTS produto_id UUID REFERENCES public.produtos(id);

-- 2. Como não temos a tabela modulos, vamos garantir que a nova coluna produto_id seja preenchida
-- Vamos permitir NULL temporariamente para não quebrar dados existentes
-- (será preenchida via interface administrativa)

-- 3. Remover campos desnecessários se existirem
ALTER TABLE public.video_aulas 
DROP COLUMN IF EXISTS duracao_segundos,
DROP COLUMN IF EXISTS transcricao_texto,
DROP COLUMN IF EXISTS tags_ia,
DROP COLUMN IF EXISTS modulo_id;

-- 4. Garantir que os campos essenciais estejam corretos
ALTER TABLE public.video_aulas 
ALTER COLUMN titulo SET NOT NULL,
ALTER COLUMN id_video_bunny DROP NOT NULL; -- Permitir NULL durante criação

-- 5. Recrear políticas para video_aulas
DROP POLICY IF EXISTS "Todos podem ver videoaulas" ON public.video_aulas;
DROP POLICY IF EXISTS "Apenas admins podem modificar videoaulas" ON public.video_aulas;

CREATE POLICY "Todos podem ver videoaulas" ON public.video_aulas
FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem modificar videoaulas" ON public.video_aulas
FOR ALL USING (public.is_admin());
