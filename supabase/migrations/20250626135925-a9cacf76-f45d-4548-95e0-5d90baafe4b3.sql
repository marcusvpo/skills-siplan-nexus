
-- Modificar tabela cartorios: remover CNPJ e adicionar cidade/estado
ALTER TABLE public.cartorios DROP COLUMN IF EXISTS cnpj;
ALTER TABLE public.cartorios ADD COLUMN cidade TEXT;
ALTER TABLE public.cartorios ADD COLUMN estado TEXT;

-- Criar nova tabela cartorio_usuarios para usuários individuais
CREATE TABLE public.cartorio_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cartorio_id UUID REFERENCES public.cartorios(id) ON DELETE CASCADE NOT NULL,
    username TEXT NOT NULL,
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_cartorio_username UNIQUE (cartorio_id, username)
);

-- Adicionar índices para buscas rápidas
CREATE INDEX idx_cartorio_usuarios_cartorio_id ON public.cartorio_usuarios (cartorio_id);
CREATE INDEX idx_cartorio_usuarios_username ON public.cartorio_usuarios (username);

-- Habilitar RLS na nova tabela
ALTER TABLE public.cartorio_usuarios ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: administradores podem ver todos os usuários
CREATE POLICY "Admins can view all cartorio users" ON public.cartorio_usuarios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Política de INSERT/UPDATE/DELETE: apenas administradores
CREATE POLICY "Admins can manage cartorio users" ON public.cartorio_usuarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Atualizar dados de demonstração existentes
INSERT INTO public.cartorio_usuarios (cartorio_id, username, email, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo',
    'demo@siplan.com.br',
    true
) ON CONFLICT (cartorio_id, username) DO NOTHING;

-- Atualizar cartório de demonstração com cidade e estado
UPDATE public.cartorios 
SET cidade = 'São Paulo', estado = 'SP' 
WHERE id = '00000000-0000-0000-0000-000000000001';
