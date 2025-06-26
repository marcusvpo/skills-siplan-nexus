
-- 1. CORRIGIR RELACIONAMENTOS AMBÍGUOS: Remover constraints duplicadas
-- Primeiro, verificar e remover foreign keys duplicadas que estão causando ambiguidade

-- Remover constraints duplicadas se existirem
ALTER TABLE public.acessos_cartorio DROP CONSTRAINT IF EXISTS acessos_cartorio_cartorio_id_fkey;
ALTER TABLE public.acessos_cartorio DROP CONSTRAINT IF EXISTS fk_acessos_cartorio;

-- Remover outras possíveis duplicações
ALTER TABLE public.produtos DROP CONSTRAINT IF EXISTS produtos_sistema_id_fkey;
ALTER TABLE public.produtos DROP CONSTRAINT IF EXISTS fk_produtos_sistema;
ALTER TABLE public.modulos DROP CONSTRAINT IF EXISTS modulos_produto_id_fkey;
ALTER TABLE public.modulos DROP CONSTRAINT IF EXISTS fk_modulos_produto;
ALTER TABLE public.video_aulas DROP CONSTRAINT IF EXISTS video_aulas_produto_id_fkey;
ALTER TABLE public.video_aulas DROP CONSTRAINT IF EXISTS fk_video_aulas_produto;
ALTER TABLE public.cartorio_usuarios DROP CONSTRAINT IF EXISTS cartorio_usuarios_cartorio_id_fkey;
ALTER TABLE public.cartorio_usuarios DROP CONSTRAINT IF EXISTS fk_cartorio_usuarios_cartorio;
ALTER TABLE public.visualizacoes_cartorio DROP CONSTRAINT IF EXISTS visualizacoes_cartorio_video_aula_id_fkey;
ALTER TABLE public.visualizacoes_cartorio DROP CONSTRAINT IF EXISTS fk_visualizacoes_video_aula;
ALTER TABLE public.visualizacoes_cartorio DROP CONSTRAINT IF EXISTS visualizacoes_cartorio_cartorio_id_fkey;
ALTER TABLE public.visualizacoes_cartorio DROP CONSTRAINT IF EXISTS fk_visualizacoes_cartorio;
ALTER TABLE public.favoritos_cartorio DROP CONSTRAINT IF EXISTS favoritos_cartorio_video_aula_id_fkey;
ALTER TABLE public.favoritos_cartorio DROP CONSTRAINT IF EXISTS fk_favoritos_video_aula;
ALTER TABLE public.favoritos_cartorio DROP CONSTRAINT IF EXISTS favoritos_cartorio_cartorio_id_fkey;
ALTER TABLE public.favoritos_cartorio DROP CONSTRAINT IF EXISTS fk_favoritos_cartorio;
ALTER TABLE public.video_embeddings DROP CONSTRAINT IF EXISTS video_embeddings_video_aula_id_fkey;
ALTER TABLE public.video_embeddings DROP CONSTRAINT IF EXISTS fk_video_embeddings_video_aula;

-- 2. RECRIAR RELACIONAMENTOS COM NOMES ÚNICOS E CONSISTENTES
-- Relacionamentos principais da hierarquia Sistema → Produto → VideoAula
ALTER TABLE public.produtos 
ADD CONSTRAINT produtos_sistema_fk 
FOREIGN KEY (sistema_id) REFERENCES public.sistemas(id) ON DELETE CASCADE;

ALTER TABLE public.modulos 
ADD CONSTRAINT modulos_produto_fk 
FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;

ALTER TABLE public.video_aulas 
ADD CONSTRAINT video_aulas_produto_fk 
FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;

-- Relacionamentos de cartórios e acessos
ALTER TABLE public.acessos_cartorio 
ADD CONSTRAINT acessos_cartorio_fk 
FOREIGN KEY (cartorio_id) REFERENCES public.cartorios(id) ON DELETE CASCADE;

ALTER TABLE public.cartorio_usuarios 
ADD CONSTRAINT cartorio_usuarios_fk 
FOREIGN KEY (cartorio_id) REFERENCES public.cartorios(id) ON DELETE CASCADE;

-- Relacionamentos de visualizações e favoritos
ALTER TABLE public.visualizacoes_cartorio 
ADD CONSTRAINT visualizacoes_video_aula_fk 
FOREIGN KEY (video_aula_id) REFERENCES public.video_aulas(id) ON DELETE CASCADE;

ALTER TABLE public.visualizacoes_cartorio 
ADD CONSTRAINT visualizacoes_cartorio_fk 
FOREIGN KEY (cartorio_id) REFERENCES public.cartorios(id) ON DELETE CASCADE;

ALTER TABLE public.favoritos_cartorio 
ADD CONSTRAINT favoritos_video_aula_fk 
FOREIGN KEY (video_aula_id) REFERENCES public.video_aulas(id) ON DELETE CASCADE;

ALTER TABLE public.favoritos_cartorio 
ADD CONSTRAINT favoritos_cartorio_fk 
FOREIGN KEY (cartorio_id) REFERENCES public.cartorios(id) ON DELETE CASCADE;

-- Relacionamentos de embeddings
ALTER TABLE public.video_embeddings 
ADD CONSTRAINT video_embeddings_fk 
FOREIGN KEY (video_aula_id) REFERENCES public.video_aulas(id) ON DELETE CASCADE;

-- 3. CORRIGIR POLÍTICAS RLS PARA CARTÓRIOS - PROBLEMA CRÍTICO DE VISIBILIDADE
-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Admin access to cartorios" ON public.cartorios;
DROP POLICY IF EXISTS "Cartorio users access" ON public.cartorio_usuarios;
DROP POLICY IF EXISTS "Admin access to acessos_cartorio" ON public.acessos_cartorio;

-- Recriar políticas corretas para administradores
CREATE POLICY "Admin full access to cartorios" ON public.cartorios
FOR ALL USING (public.is_admin());

CREATE POLICY "Admin full access to acessos_cartorio" ON public.acessos_cartorio
FOR ALL USING (public.is_admin());

CREATE POLICY "Admin and cartorio access to usuarios" ON public.cartorio_usuarios
FOR ALL USING (
    public.is_admin() OR cartorio_id = public.get_current_cartorio_id()
);

-- 4. OTIMIZAR ÍNDICES PARA PERFORMANCE DAS QUERIES HIERÁRQUICAS
-- Remover índices duplicados se existirem
DROP INDEX IF EXISTS idx_produtos_sistema_id;
DROP INDEX IF EXISTS idx_modulos_produto_id;
DROP INDEX IF EXISTS idx_video_aulas_produto_id;
DROP INDEX IF EXISTS idx_visualizacoes_cartorio_id;
DROP INDEX IF EXISTS idx_visualizacoes_video_aula_id;
DROP INDEX IF EXISTS idx_favoritos_cartorio_id;
DROP INDEX IF EXISTS idx_favoritos_video_aula_id;
DROP INDEX IF EXISTS idx_acessos_login_token;
DROP INDEX IF EXISTS idx_acessos_cartorio_id;
DROP INDEX IF EXISTS idx_cartorio_usuarios_cartorio_id;

-- Recriar índices otimizados
CREATE INDEX produtos_sistema_idx ON public.produtos(sistema_id);
CREATE INDEX produtos_ordem_idx ON public.produtos(ordem);
CREATE INDEX modulos_produto_idx ON public.modulos(produto_id);
CREATE INDEX modulos_ordem_idx ON public.modulos(ordem);
CREATE INDEX video_aulas_produto_idx ON public.video_aulas(produto_id);
CREATE INDEX video_aulas_ordem_idx ON public.video_aulas(ordem);
CREATE INDEX visualizacoes_cartorio_idx ON public.visualizacoes_cartorio(cartorio_id);
CREATE INDEX visualizacoes_video_aula_idx ON public.visualizacoes_cartorio(video_aula_id);
CREATE INDEX visualizacoes_data_idx ON public.visualizacoes_cartorio(ultima_visualizacao);
CREATE INDEX favoritos_cartorio_idx ON public.favoritos_cartorio(cartorio_id);
CREATE INDEX favoritos_video_aula_idx ON public.favoritos_cartorio(video_aula_id);
CREATE INDEX acessos_token_idx ON public.acessos_cartorio(login_token);
CREATE INDEX acessos_cartorio_idx ON public.acessos_cartorio(cartorio_id);
CREATE INDEX acessos_ativo_idx ON public.acessos_cartorio(ativo);
CREATE INDEX cartorio_usuarios_cartorio_idx ON public.cartorio_usuarios(cartorio_id);
CREATE INDEX cartorio_usuarios_active_idx ON public.cartorio_usuarios(is_active);

-- 5. MELHORAR FUNÇÃO get_current_cartorio_id() PARA MAIOR ROBUSTEZ
CREATE OR REPLACE FUNCTION public.get_current_cartorio_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
    cartorio_uuid UUID;
    jwt_payload JSONB;
    auth_header TEXT;
    token TEXT;
BEGIN
    -- Log inicial para debug
    RAISE LOG 'get_current_cartorio_id: Iniciando busca do cartorio_id';
    
    -- Primeiro: tentar extrair do JWT customizado
    BEGIN
        jwt_payload := current_setting('request.jwt.claims', true)::jsonb;
        IF jwt_payload IS NOT NULL THEN
            cartorio_uuid := (jwt_payload ->> 'cartorio_id')::UUID;
            
            IF cartorio_uuid IS NOT NULL THEN
                RAISE LOG 'get_current_cartorio_id: Encontrado cartorio_id no JWT: %', cartorio_uuid;
                
                -- Verificar se o cartório existe e está ativo
                SELECT id INTO cartorio_uuid
                FROM public.cartorios 
                WHERE id = cartorio_uuid AND is_active = true;
                
                IF cartorio_uuid IS NOT NULL THEN
                    RETURN cartorio_uuid;
                ELSE
                    RAISE LOG 'get_current_cartorio_id: Cartório do JWT não está ativo';
                END IF;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'get_current_cartorio_id: Erro ao ler JWT claims: %', SQLERRM;
    END;
    
    -- Segundo: verificar token customizado via header
    BEGIN
        auth_header := current_setting('request.headers', true)::json->>'authorization';
        IF auth_header IS NOT NULL THEN
            IF auth_header LIKE 'Bearer CART-%' THEN
                token := replace(auth_header, 'Bearer ', '');
                RAISE LOG 'get_current_cartorio_id: Encontrado token customizado: %', token;
                
                SELECT ac.cartorio_id INTO cartorio_uuid
                FROM public.acessos_cartorio ac
                INNER JOIN public.cartorios c ON c.id = ac.cartorio_id
                WHERE ac.login_token = token 
                AND ac.ativo = true 
                AND ac.data_expiracao > now()
                AND c.is_active = true;
                
                IF cartorio_uuid IS NOT NULL THEN
                    RAISE LOG 'get_current_cartorio_id: Cartório válido encontrado: %', cartorio_uuid;
                    RETURN cartorio_uuid;
                ELSE
                    RAISE LOG 'get_current_cartorio_id: Token encontrado mas acesso inválido';
                END IF;
                
            ELSIF auth_header = 'Bearer DEMO-SIPLANSKILLS-CARTORIO' THEN
                -- Token demo especial
                SELECT id INTO cartorio_uuid 
                FROM public.cartorios 
                WHERE nome = 'Cartório de Demonstração' 
                AND is_active = true
                LIMIT 1;
                
                IF cartorio_uuid IS NOT NULL THEN
                    RAISE LOG 'get_current_cartorio_id: Usando cartório demo: %', cartorio_uuid;
                    RETURN cartorio_uuid;
                END IF;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'get_current_cartorio_id: Erro ao processar header de autorização: %', SQLERRM;
    END;
    
    RAISE LOG 'get_current_cartorio_id: Nenhum cartorio_id válido encontrado';
    RETURN NULL;
END;
$function$;

-- 6. MELHORAR FUNÇÃO is_admin() COM MAIS ROBUSTEZ
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
    user_uuid UUID;
    is_admin_user BOOLEAN := FALSE;
    jwt_payload JSONB;
BEGIN
    -- Primeiro: verificar se é admin via Supabase Auth
    user_uuid := auth.uid();
    
    IF user_uuid IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 
            FROM public.admins 
            WHERE id = user_uuid
        ) INTO is_admin_user;
        
        IF is_admin_user THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Segundo: verificar via JWT customizado
    BEGIN
        jwt_payload := current_setting('request.jwt.claims', true)::jsonb;
        IF jwt_payload IS NOT NULL THEN
            -- Verificar se tem role admin no JWT
            IF (jwt_payload ->> 'role') = 'admin' THEN
                RETURN TRUE;
            END IF;
            
            -- Verificar admin via email no JWT
            SELECT EXISTS (
                SELECT 1 
                FROM public.admins 
                WHERE email = (jwt_payload ->> 'email')
            ) INTO is_admin_user;
            
            IF is_admin_user THEN
                RETURN TRUE;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Em caso de erro, continuar com FALSE
            NULL;
    END;
    
    RETURN FALSE;
END;
$function$;

-- 7. GARANTIR DADOS DEMO CONSISTENTES
-- Verificar se o cartório demo existe, senão criar
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

-- Verificar se o acesso demo existe, senão criar
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

-- 8. ANÁLISE E OTIMIZAÇÃO FINAL
ANALYZE public.sistemas;
ANALYZE public.produtos;
ANALYZE public.modulos;
ANALYZE public.video_aulas;
ANALYZE public.cartorios;
ANALYZE public.acessos_cartorio;
ANALYZE public.cartorio_usuarios;
ANALYZE public.visualizacoes_cartorio;
ANALYZE public.favoritos_cartorio;
ANALYZE public.admins;
