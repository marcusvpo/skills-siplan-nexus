-- AUDITORIA E LIMPEZA COMPLETA DO SISTEMA RLS
-- Migração para JWT customizado e eliminação de redundâncias

-- 1. HABILITAR RLS NA TABELA user_video_progress (detectado pelo linter)
ALTER TABLE public.user_video_progress ENABLE ROW LEVEL SECURITY;

-- 2. LIMPAR POLÍTICAS REDUNDANTES E CONFLITANTES

-- acessos_cartorio: Remover política duplicada
DROP POLICY IF EXISTS "Admins can manage acessos_cartorio" ON public.acessos_cartorio;
-- Manter apenas: "Admins manage acessos_cartorio" e "Cartorios view own acessos"

-- admins: Remover dependência de auth.jwt()
DROP POLICY IF EXISTS "Admins manage own profile" ON public.admins;
CREATE POLICY "Admins manage own profile"
ON public.admins
FOR ALL
USING (is_admin() OR (email = (SELECT email FROM public.admins WHERE id = (current_setting('request.jwt.claims', true)::jsonb ->> 'user_id')::uuid)));

-- produtos: Limpar múltiplas políticas redundantes e inconsistentes
DROP POLICY IF EXISTS "Admin modify access to produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can view produtos" ON public.produtos;
DROP POLICY IF EXISTS "Produtos access policy" ON public.produtos;
DROP POLICY IF EXISTS "Produtos are public for authenticated users" ON public.produtos;
DROP POLICY IF EXISTS "Public read access to produtos" ON public.produtos;

-- Recriar políticas limpas para produtos
CREATE POLICY "Admins manage produtos"
ON public.produtos
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Cartorios view accessible produtos"
ON public.produtos
FOR SELECT
USING (
    is_admin() OR
    -- Se não há restrições específicas para o cartório, libera tudo
    NOT EXISTS (
        SELECT 1 FROM public.cartorio_acesso_conteudo 
        WHERE cartorio_id = get_current_cartorio_id_from_jwt() AND ativo = true
    ) OR
    -- Se há restrições, verifica permissão específica
    EXISTS (
        SELECT 1 FROM public.cartorio_acesso_conteudo cac
        WHERE cac.cartorio_id = get_current_cartorio_id_from_jwt() 
        AND cac.ativo = true
        AND (
            cac.produto_id = produtos.id OR
            (cac.sistema_id = produtos.sistema_id AND cac.produto_id IS NULL)
        )
    )
);

-- sistemas: Limpar múltiplas políticas redundantes
DROP POLICY IF EXISTS "Admin modify access to sistemas" ON public.sistemas;
DROP POLICY IF EXISTS "Authenticated users can view sistemas" ON public.sistemas;
DROP POLICY IF EXISTS "Public read access to sistemas" ON public.sistemas;
DROP POLICY IF EXISTS "Sistemas access policy" ON public.sistemas;
DROP POLICY IF EXISTS "Sistemas are public for authenticated users" ON public.sistemas;

-- Recriar políticas limpas para sistemas
CREATE POLICY "Admins manage sistemas"
ON public.sistemas
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Cartorios view accessible sistemas"
ON public.sistemas
FOR SELECT
USING (
    is_admin() OR
    -- Se não há restrições específicas para o cartório, libera tudo
    NOT EXISTS (
        SELECT 1 FROM public.cartorio_acesso_conteudo 
        WHERE cartorio_id = get_current_cartorio_id_from_jwt() AND ativo = true
    ) OR
    -- Se há restrições, verifica se tem acesso ao sistema ou algum produto do sistema
    EXISTS (
        SELECT 1 FROM public.cartorio_acesso_conteudo cac
        WHERE cac.cartorio_id = get_current_cartorio_id_from_jwt() 
        AND cac.ativo = true
        AND (
            (cac.sistema_id = sistemas.id AND cac.produto_id IS NULL) OR
            cac.produto_id IN (
                SELECT p.id FROM public.produtos p 
                WHERE p.sistema_id = sistemas.id
            )
        )
    )
);

-- video_aulas: Limpar múltiplas políticas redundantes
DROP POLICY IF EXISTS "Admin modify access to video_aulas" ON public.video_aulas;
DROP POLICY IF EXISTS "Admins can delete video_aulas" ON public.video_aulas;
DROP POLICY IF EXISTS "Admins can insert video_aulas" ON public.video_aulas;
DROP POLICY IF EXISTS "Admins can update video_aulas" ON public.video_aulas;
DROP POLICY IF EXISTS "Admins can view all video_aulas" ON public.video_aulas;
DROP POLICY IF EXISTS "Authenticated users can view video_aulas" ON public.video_aulas;
DROP POLICY IF EXISTS "Public read access to video_aulas" ON public.video_aulas;
DROP POLICY IF EXISTS "Video aulas access policy" ON public.video_aulas;
DROP POLICY IF EXISTS "Video aulas are public for authenticated users" ON public.video_aulas;

-- Recriar políticas limpas para video_aulas
CREATE POLICY "Admins manage video_aulas"
ON public.video_aulas
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Cartorios view accessible video_aulas"
ON public.video_aulas
FOR SELECT
USING (
    is_admin() OR
    -- Se não há restrições específicas para o cartório, libera tudo
    NOT EXISTS (
        SELECT 1 FROM public.cartorio_acesso_conteudo 
        WHERE cartorio_id = get_current_cartorio_id_from_jwt() AND ativo = true
    ) OR
    -- Se há restrições, verifica permissão via produto
    EXISTS (
        SELECT 1 FROM public.cartorio_acesso_conteudo cac
        INNER JOIN public.produtos p ON video_aulas.produto_id = p.id
        WHERE cac.cartorio_id = get_current_cartorio_id_from_jwt() 
        AND cac.ativo = true
        AND (
            cac.produto_id = p.id OR
            (cac.sistema_id = p.sistema_id AND cac.produto_id IS NULL)
        )
    )
);

-- user_video_progress: Criar políticas básicas
CREATE POLICY "Users manage own progress"
ON public.user_video_progress
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage all progress"
ON public.user_video_progress
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 3. ATUALIZAR FUNÇÃO get_current_cartorio_id PARA USAR JWT CUSTOMIZADO
CREATE OR REPLACE FUNCTION public.get_current_cartorio_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Usar a função robusta já existente
    RETURN public.get_current_cartorio_id_from_jwt();
END;
$$;

-- 4. MELHORAR FUNÇÃO is_admin COM SEARCH_PATH SEGURO
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_uuid UUID;
    is_admin_user BOOLEAN := FALSE;
    jwt_payload JSONB;
BEGIN
    -- Verificar se é admin via JWT customizado primeiro
    BEGIN
        jwt_payload := current_setting('request.jwt.claims', true)::jsonb;
        IF jwt_payload IS NOT NULL THEN
            -- Verificar se tem role admin no JWT
            IF (jwt_payload ->> 'role') = 'admin' THEN
                RETURN TRUE;
            END IF;
            
            -- Verificar admin via email no JWT
            SELECT EXISTS (
                SELECT 1 FROM public.admins 
                WHERE email = (jwt_payload ->> 'email')
            ) INTO is_admin_user;
            
            IF is_admin_user THEN
                RETURN TRUE;
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Fallback: verificar se é admin via Supabase Auth
    user_uuid := auth.uid();
    IF user_uuid IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = user_uuid
        ) INTO is_admin_user;
        
        RETURN is_admin_user;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 5. ATUALIZAR DEMAIS FUNÇÕES COM SEARCH_PATH SEGURO
CREATE OR REPLACE FUNCTION public.get_current_cartorio_id_from_jwt()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    jwt_payload JSONB;
    cartorio_id UUID;
    auth_header TEXT;
    token_parts TEXT[];
    decoded_payload JSONB;
BEGIN
    -- Método 1: Tentar obter do JWT customizado via request.jwt.claims
    BEGIN
        jwt_payload := current_setting('request.jwt.claims', true)::jsonb;
        
        -- Verificar se é um JWT de cartório (tem cartorio_id)
        IF jwt_payload IS NOT NULL THEN
            cartorio_id := (jwt_payload ->> 'cartorio_id')::UUID;
            IF cartorio_id IS NOT NULL THEN
                RETURN cartorio_id;
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Método 2: Tentar obter via setting de sessão
    BEGIN
        cartorio_id := current_setting('request.cartorio_id', true)::UUID;
        IF cartorio_id IS NOT NULL THEN
            RETURN cartorio_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Método 3: Tentar obter via contexto de aplicação
    BEGIN
        cartorio_id := current_setting('app.current_cartorio_id', true)::UUID;
        IF cartorio_id IS NOT NULL THEN
            RETURN cartorio_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Se chegou aqui, não encontrou o cartorio_id
    RETURN NULL;
END;
$$;