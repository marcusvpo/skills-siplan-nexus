
-- Adicionar campo is_active para cartórios
ALTER TABLE public.cartorios ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Adicionar campo observacoes para cartórios
ALTER TABLE public.cartorios ADD COLUMN observacoes TEXT;

-- Modificar a tabela visualizacoes_cartorio para rastrear por usuário individual
-- Primeiro, adicionar a nova coluna
ALTER TABLE public.visualizacoes_cartorio ADD COLUMN cartorio_usuario_id UUID REFERENCES public.cartorio_usuarios(id) ON DELETE CASCADE;

-- Criar função para obter o ID do usuário atual do cartório
CREATE OR REPLACE FUNCTION public.get_current_cartorio_usuario_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
    usuario_uuid UUID;
    jwt_payload JSONB;
BEGIN
    -- Extrair o user_id do JWT customizado
    BEGIN
        jwt_payload := current_setting('request.jwt.claims', true)::jsonb;
        usuario_uuid := (jwt_payload ->> 'user_id')::UUID;
        
        -- Verificar se o usuário existe e está ativo
        IF usuario_uuid IS NOT NULL THEN
            SELECT id INTO usuario_uuid 
            FROM public.cartorio_usuarios 
            WHERE id = usuario_uuid AND is_active = TRUE;
        END IF;
        
        RETURN usuario_uuid;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN NULL;
    END;
END;
$$;

-- Atualizar políticas RLS para visualizacoes_cartorio
DROP POLICY IF EXISTS "Users can view their own progress" ON public.visualizacoes_cartorio;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.visualizacoes_cartorio;
DROP POLICY IF EXISTS "Admins can view all progress" ON public.visualizacoes_cartorio;

-- Habilitar RLS na tabela visualizacoes_cartorio
ALTER TABLE public.visualizacoes_cartorio ENABLE ROW LEVEL SECURITY;

-- Nova política para usuários verem apenas seu próprio progresso
CREATE POLICY "Users can view their own progress" ON public.visualizacoes_cartorio
    FOR SELECT USING (
        cartorio_usuario_id = public.get_current_cartorio_usuario_id()
    );

-- Nova política para usuários atualizarem apenas seu próprio progresso
CREATE POLICY "Users can update their own progress" ON public.visualizacoes_cartorio
    FOR ALL USING (
        cartorio_usuario_id = public.get_current_cartorio_usuario_id()
    );

-- Política para administradores verem todos os progressos
CREATE POLICY "Admins can view all progress" ON public.visualizacoes_cartorio
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Atualizar registros existentes para usar cartorio_usuario_id
-- Migrar dados existentes se houver (isso pode ser ajustado conforme necessário)
UPDATE public.visualizacoes_cartorio 
SET cartorio_usuario_id = (
    SELECT cu.id 
    FROM public.cartorio_usuarios cu 
    WHERE cu.cartorio_id = public.visualizacoes_cartorio.cartorio_id 
    LIMIT 1
)
WHERE cartorio_usuario_id IS NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_visualizacoes_cartorio_usuario_id ON public.visualizacoes_cartorio (cartorio_usuario_id);

-- Adicionar políticas RLS para as outras tabelas (sistemas, produtos, modulos, video_aulas)
-- Para permitir acesso de leitura a usuários autenticados

-- Sistemas
ALTER TABLE public.sistemas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view sistemas" ON public.sistemas
    FOR SELECT TO authenticated USING (true);

-- Produtos  
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view produtos" ON public.produtos
    FOR SELECT TO authenticated USING (true);

-- Módulos
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view modulos" ON public.modulos
    FOR SELECT TO authenticated USING (true);

-- Video Aulas
ALTER TABLE public.video_aulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view video_aulas" ON public.video_aulas
    FOR SELECT TO authenticated USING (true);

-- Favoritos
ALTER TABLE public.favoritos_cartorio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own favorites" ON public.favoritos_cartorio
    FOR ALL USING (
        cartorio_id IN (
            SELECT cartorio_id 
            FROM public.cartorio_usuarios 
            WHERE id = public.get_current_cartorio_usuario_id()
        )
    );
