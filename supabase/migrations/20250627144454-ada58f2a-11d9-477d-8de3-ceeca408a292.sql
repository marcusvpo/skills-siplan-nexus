
-- 1. AUDITORIA E CORREÇÃO DAS POLÍTICAS RLS PARA CARTÓRIOS
-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Admin full access to cartorios" ON public.cartorios;
DROP POLICY IF EXISTS "Admin full access to acessos_cartorio" ON public.acessos_cartorio;
DROP POLICY IF EXISTS "Admin and cartorio access to usuarios" ON public.cartorio_usuarios;

-- Recriar políticas RLS mais permissivas para administradores
CREATE POLICY "Admins têm acesso total a cartórios" ON public.cartorios
FOR ALL USING (public.is_admin());

CREATE POLICY "Admins têm acesso total a acessos_cartorio" ON public.acessos_cartorio
FOR ALL USING (public.is_admin());

CREATE POLICY "Admin e cartório podem acessar usuários" ON public.cartorio_usuarios
FOR ALL USING (
    public.is_admin() OR cartorio_id = public.get_current_cartorio_id()
);

-- 2. MELHORAR FUNÇÃO is_admin() COM LOGGING PARA DEBUG
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
    user_uuid UUID;
    is_admin_user BOOLEAN := FALSE;
    jwt_payload JSONB;
    admin_count INTEGER;
BEGIN
    -- Log inicial para debug
    RAISE LOG 'is_admin: Iniciando verificação de admin';
    
    -- Primeiro: verificar se é admin via Supabase Auth
    user_uuid := auth.uid();
    RAISE LOG 'is_admin: auth.uid() = %', user_uuid;
    
    IF user_uuid IS NOT NULL THEN
        SELECT COUNT(*) INTO admin_count
        FROM public.admins 
        WHERE id = user_uuid;
        
        RAISE LOG 'is_admin: Encontrados % admins para user_uuid %', admin_count, user_uuid;
        
        IF admin_count > 0 THEN
            RAISE LOG 'is_admin: Usuário é admin via Supabase Auth';
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Segundo: verificar via JWT customizado
    BEGIN
        jwt_payload := current_setting('request.jwt.claims', true)::jsonb;
        RAISE LOG 'is_admin: JWT payload = %', jwt_payload;
        
        IF jwt_payload IS NOT NULL THEN
            -- Verificar se tem role admin no JWT
            IF (jwt_payload ->> 'role') = 'admin' THEN
                RAISE LOG 'is_admin: Usuário é admin via JWT role';
                RETURN TRUE;
            END IF;
            
            -- Verificar admin via email no JWT
            IF jwt_payload ->> 'email' IS NOT NULL THEN
                SELECT COUNT(*) INTO admin_count
                FROM public.admins 
                WHERE email = (jwt_payload ->> 'email');
                
                RAISE LOG 'is_admin: Encontrados % admins para email %', admin_count, (jwt_payload ->> 'email');
                
                IF admin_count > 0 THEN
                    RAISE LOG 'is_admin: Usuário é admin via JWT email';
                    RETURN TRUE;
                END IF;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'is_admin: Erro ao processar JWT: %', SQLERRM;
    END;
    
    RAISE LOG 'is_admin: Usuário NÃO é admin';
    RETURN FALSE;
END;
$function$;

-- 3. GARANTIR QUE EXISTE UM ADMIN PARA TESTES
-- Inserir um admin padrão se não existir
INSERT INTO public.admins (id, email, nome) 
VALUES (
    gen_random_uuid(),
    'admin@siplan.com.br',
    'Administrador Principal'
) ON CONFLICT (email) DO NOTHING;

-- 4. MELHORAR A EDGE FUNCTION login-cartorio COM LOGGING DETALHADO
-- Verificar se existe token demo e cartório demo
INSERT INTO public.cartorios (id, nome, cidade, estado, is_active) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Cartório de Demonstração',
    'São Paulo',
    'SP',
    true
) ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    cidade = EXCLUDED.cidade,
    estado = EXCLUDED.estado,
    is_active = true;

-- Garantir que o acesso demo existe
INSERT INTO public.acessos_cartorio (login_token, cartorio_id, data_expiracao, email_contato, ativo)
VALUES (
    'DEMO-SIPLANSKILLS-CARTORIO',
    '00000000-0000-0000-0000-000000000001',
    '2025-12-31 23:59:59',
    'demo@siplan.com.br',
    true
) ON CONFLICT (login_token) DO UPDATE SET
    cartorio_id = EXCLUDED.cartorio_id,
    data_expiracao = EXCLUDED.data_expiracao,
    ativo = true;

-- Criar usuário demo se não existir
INSERT INTO public.cartorio_usuarios (cartorio_id, username, email, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo',
    'demo@cartorio.com.br',
    true
) ON CONFLICT (cartorio_id, username) DO UPDATE SET
    email = EXCLUDED.email,
    is_active = true;

-- 5. ADICIONAR ÍNDICES PARA MELHORAR PERFORMANCE DAS QUERIES
CREATE INDEX IF NOT EXISTS idx_cartorios_active ON public.cartorios(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_acessos_token_active ON public.acessos_cartorio(login_token, ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_acessos_expiracao ON public.acessos_cartorio(data_expiracao) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_cartorio_usuarios_active ON public.cartorio_usuarios(cartorio_id, is_active) WHERE is_active = true;

-- 6. FUNÇÃO PARA DEBUGAR DADOS DE CARTÓRIOS (APENAS PARA ADMINS)
CREATE OR REPLACE FUNCTION public.debug_cartorios_data()
RETURNS TABLE(
    cartorio_id UUID,
    cartorio_nome TEXT,
    cartorio_ativo BOOLEAN,
    tokens_count BIGINT,
    usuarios_count BIGINT,
    tokens_ativos BIGINT,
    tokens_expirados BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Esta função só pode ser executada por admins
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar esta função';
    END IF;
    
    RETURN QUERY
    SELECT 
        c.id as cartorio_id,
        c.nome as cartorio_nome,
        c.is_active as cartorio_ativo,
        COALESCE(ac.tokens_count, 0) as tokens_count,
        COALESCE(cu.usuarios_count, 0) as usuarios_count,
        COALESCE(ac.tokens_ativos, 0) as tokens_ativos,
        COALESCE(ac.tokens_expirados, 0) as tokens_expirados
    FROM public.cartorios c
    LEFT JOIN (
        SELECT 
            cartorio_id,
            COUNT(*) as tokens_count,
            COUNT(*) FILTER (WHERE ativo = true AND data_expiracao > now()) as tokens_ativos,
            COUNT(*) FILTER (WHERE ativo = false OR data_expiracao <= now()) as tokens_expirados
        FROM public.acessos_cartorio
        GROUP BY cartorio_id
    ) ac ON c.id = ac.cartorio_id
    LEFT JOIN (
        SELECT 
            cartorio_id,
            COUNT(*) as usuarios_count
        FROM public.cartorio_usuarios
        WHERE is_active = true
        GROUP BY cartorio_id
    ) cu ON c.id = cu.cartorio_id
    ORDER BY c.nome;
END;
$function$;

-- 7. ANALISAR E OTIMIZAR ESTATÍSTICAS DAS TABELAS
ANALYZE public.cartorios;
ANALYZE public.acessos_cartorio;
ANALYZE public.cartorio_usuarios;
ANALYZE public.admins;
