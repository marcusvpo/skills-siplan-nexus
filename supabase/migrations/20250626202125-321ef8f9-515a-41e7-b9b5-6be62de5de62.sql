
-- 1. CORREÇÃO CRÍTICA: Adicionar constraints de integridade referencial ausentes
-- Muitas tabelas não têm foreign keys definidas, causando inconsistências

-- Adicionar foreign keys para produtos
ALTER TABLE public.produtos 
ADD CONSTRAINT fk_produtos_sistema 
FOREIGN KEY (sistema_id) REFERENCES public.sistemas(id) ON DELETE CASCADE;

-- Adicionar foreign keys para modulos
ALTER TABLE public.modulos 
ADD CONSTRAINT fk_modulos_produto 
FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;

-- Adicionar foreign keys para video_aulas (produto_id pode ser null durante migração)
ALTER TABLE public.video_aulas 
ADD CONSTRAINT fk_video_aulas_produto 
FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;

-- Adicionar foreign keys para acessos_cartorio
ALTER TABLE public.acessos_cartorio 
ADD CONSTRAINT fk_acessos_cartorio 
FOREIGN KEY (cartorio_id) REFERENCES public.cartorios(id) ON DELETE CASCADE;

-- Adicionar foreign keys para cartorio_usuarios
ALTER TABLE public.cartorio_usuarios 
ADD CONSTRAINT fk_cartorio_usuarios_cartorio 
FOREIGN KEY (cartorio_id) REFERENCES public.cartorios(id) ON DELETE CASCADE;

-- Adicionar foreign keys para visualizacoes_cartorio
ALTER TABLE public.visualizacoes_cartorio 
ADD CONSTRAINT fk_visualizacoes_video_aula 
FOREIGN KEY (video_aula_id) REFERENCES public.video_aulas(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_visualizacoes_cartorio 
FOREIGN KEY (cartorio_id) REFERENCES public.cartorios(id) ON DELETE CASCADE;

-- Adicionar foreign keys para favoritos_cartorio
ALTER TABLE public.favoritos_cartorio 
ADD CONSTRAINT fk_favoritos_video_aula 
FOREIGN KEY (video_aula_id) REFERENCES public.video_aulas(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_favoritos_cartorio 
FOREIGN KEY (cartorio_id) REFERENCES public.cartorios(id) ON DELETE CASCADE;

-- Adicionar foreign keys para video_embeddings
ALTER TABLE public.video_embeddings 
ADD CONSTRAINT fk_video_embeddings_video_aula 
FOREIGN KEY (video_aula_id) REFERENCES public.video_aulas(id) ON DELETE CASCADE;

-- 2. ÍNDICES CRÍTICOS PARA PERFORMANCE
-- Adicionar índices nas colunas mais consultadas

CREATE INDEX IF NOT EXISTS idx_produtos_sistema_id ON public.produtos(sistema_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ordem ON public.produtos(ordem);

CREATE INDEX IF NOT EXISTS idx_modulos_produto_id ON public.modulos(produto_id);
CREATE INDEX IF NOT EXISTS idx_modulos_ordem ON public.modulos(ordem);

CREATE INDEX IF NOT EXISTS idx_video_aulas_produto_id ON public.video_aulas(produto_id);
CREATE INDEX IF NOT EXISTS idx_video_aulas_ordem ON public.video_aulas(ordem);

CREATE INDEX IF NOT EXISTS idx_visualizacoes_cartorio_id ON public.visualizacoes_cartorio(cartorio_id);
CREATE INDEX IF NOT EXISTS idx_visualizacoes_video_aula_id ON public.visualizacoes_cartorio(video_aula_id);
CREATE INDEX IF NOT EXISTS idx_visualizacoes_ultima_visualizacao ON public.visualizacoes_cartorio(ultima_visualizacao);

CREATE INDEX IF NOT EXISTS idx_favoritos_cartorio_id ON public.favoritos_cartorio(cartorio_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_video_aula_id ON public.favoritos_cartorio(video_aula_id);

CREATE INDEX IF NOT EXISTS idx_acessos_login_token ON public.acessos_cartorio(login_token);
CREATE INDEX IF NOT EXISTS idx_acessos_cartorio_id ON public.acessos_cartorio(cartorio_id);
CREATE INDEX IF NOT EXISTS idx_acessos_ativo ON public.acessos_cartorio(ativo);

CREATE INDEX IF NOT EXISTS idx_cartorio_usuarios_cartorio_id ON public.cartorio_usuarios(cartorio_id);
CREATE INDEX IF NOT EXISTS idx_cartorio_usuarios_active ON public.cartorio_usuarios(is_active);

-- 3. CORREÇÃO DAS CONSTRAINTS UNIQUE AUSENTES
-- Adicionar constraints para evitar duplicações

ALTER TABLE public.sistemas 
ADD CONSTRAINT unique_sistema_nome UNIQUE (nome);

ALTER TABLE public.produtos 
ADD CONSTRAINT unique_produto_nome_sistema UNIQUE (nome, sistema_id);

ALTER TABLE public.modulos 
ADD CONSTRAINT unique_modulo_titulo_produto UNIQUE (titulo, produto_id);

ALTER TABLE public.video_aulas 
ADD CONSTRAINT unique_video_aula_titulo_produto UNIQUE (titulo, produto_id);

ALTER TABLE public.cartorio_usuarios 
ADD CONSTRAINT unique_cartorio_usuario_username UNIQUE (cartorio_id, username);

ALTER TABLE public.visualizacoes_cartorio 
ADD CONSTRAINT unique_visualizacao_cartorio_video UNIQUE (cartorio_id, video_aula_id);

ALTER TABLE public.favoritos_cartorio 
ADD CONSTRAINT unique_favorito_cartorio_video UNIQUE (cartorio_id, video_aula_id);

-- 4. CORREÇÃO DE VALORES DEFAULT E NOT NULL
-- Garantir consistência nos valores padrão

ALTER TABLE public.sistemas 
ALTER COLUMN ordem SET DEFAULT 1,
ALTER COLUMN ordem SET NOT NULL;

ALTER TABLE public.produtos 
ALTER COLUMN ordem SET DEFAULT 1,
ALTER COLUMN ordem SET NOT NULL;

ALTER TABLE public.modulos 
ALTER COLUMN ordem SET DEFAULT 1,
ALTER COLUMN ordem SET NOT NULL;

ALTER TABLE public.video_aulas 
ALTER COLUMN ordem SET DEFAULT 1,
ALTER COLUMN ordem SET NOT NULL,
ALTER COLUMN url_video SET DEFAULT '';

-- 5. CORRIGIR FUNÇÃO get_current_cartorio_id PARA SER MAIS ROBUSTA
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
    -- Log da execução para debug
    RAISE LOG 'get_current_cartorio_id: Starting function execution';
    
    -- Primeiro: tentar extrair do JWT customizado
    BEGIN
        jwt_payload := current_setting('request.jwt.claims', true)::jsonb;
        IF jwt_payload IS NOT NULL THEN
            cartorio_uuid := (jwt_payload ->> 'cartorio_id')::UUID;
            
            IF cartorio_uuid IS NOT NULL THEN
                RAISE LOG 'get_current_cartorio_id: Found cartorio_id in JWT: %', cartorio_uuid;
                RETURN cartorio_uuid;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'get_current_cartorio_id: Error reading JWT claims: %', SQLERRM;
    END;
    
    -- Segundo: verificar token customizado via header
    BEGIN
        auth_header := current_setting('request.headers', true)::json->>'authorization';
        IF auth_header IS NOT NULL AND auth_header LIKE 'Bearer CART-%' THEN
            token := replace(auth_header, 'Bearer ', '');
            RAISE LOG 'get_current_cartorio_id: Found custom token: %', token;
            
            SELECT ac.cartorio_id INTO cartorio_uuid
            FROM public.acessos_cartorio ac
            WHERE ac.login_token = token 
            AND ac.ativo = true 
            AND ac.data_expiracao > now();
            
            IF cartorio_uuid IS NOT NULL THEN
                RAISE LOG 'get_current_cartorio_id: Found cartorio_id from token: %', cartorio_uuid;
                RETURN cartorio_uuid;
            ELSE
                RAISE LOG 'get_current_cartorio_id: Token found but no valid access record';
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'get_current_cartorio_id: Error reading auth header: %', SQLERRM;
    END;
    
    -- Terceiro: verificar token demo
    BEGIN
        IF auth_header = 'Bearer DEMO-SIPLANSKILLS-CARTORIO' THEN
            SELECT id INTO cartorio_uuid 
            FROM public.cartorios 
            WHERE nome = 'Cartório de Demonstração' 
            LIMIT 1;
            
            IF cartorio_uuid IS NOT NULL THEN
                RAISE LOG 'get_current_cartorio_id: Using demo cartorio: %', cartorio_uuid;
                RETURN cartorio_uuid;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'get_current_cartorio_id: Error handling demo token: %', SQLERRM;
    END;
    
    RAISE LOG 'get_current_cartorio_id: No cartorio_id found, returning NULL';
    RETURN NULL;
END;
$function$;

-- 6. MELHORAR FUNÇÃO is_admin PARA SER MAIS ROBUSTA
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
    user_uuid UUID;
    is_admin_user BOOLEAN := FALSE;
BEGIN
    -- Tentar obter o user_id do auth.uid() primeiro (Supabase Auth)
    user_uuid := auth.uid();
    
    IF user_uuid IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 
            FROM public.admins 
            WHERE id = user_uuid
        ) INTO is_admin_user;
        
        RETURN is_admin_user;
    END IF;
    
    -- Se não há usuário autenticado via Supabase Auth, verificar se é um admin via email
    -- (para casos onde admin faz login via interface customizada)
    BEGIN
        SELECT EXISTS (
            SELECT 1 
            FROM public.admins 
            WHERE email = current_setting('request.jwt.claims', true)::jsonb->>'email'
        ) INTO is_admin_user;
        
        RETURN is_admin_user;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN FALSE;
    END;
    
    RETURN FALSE;
END;
$function$;

-- 7. CORRIGIR E OTIMIZAR POLÍTICAS RLS
-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Todos podem ver sistemas" ON public.sistemas;
DROP POLICY IF EXISTS "Apenas admins podem modificar sistemas" ON public.sistemas;
DROP POLICY IF EXISTS "Todos podem ver produtos" ON public.produtos;
DROP POLICY IF EXISTS "Apenas admins podem modificar produtos" ON public.produtos;
DROP POLICY IF EXISTS "Todos podem ver modulos" ON public.modulos;
DROP POLICY IF EXISTS "Apenas admins podem modificar modulos" ON public.modulos;
DROP POLICY IF EXISTS "Todos podem ver videoaulas" ON public.video_aulas;
DROP POLICY IF EXISTS "Apenas admins podem modificar videoaulas" ON public.video_aulas;

-- Recriar políticas mais robustas e otimizadas
-- Sistemas: acesso público para leitura, apenas admins para modificação
CREATE POLICY "Public read access to sistemas" ON public.sistemas
FOR SELECT USING (true);

CREATE POLICY "Admin modify access to sistemas" ON public.sistemas
FOR ALL USING (public.is_admin());

-- Produtos: acesso público para leitura, apenas admins para modificação
CREATE POLICY "Public read access to produtos" ON public.produtos
FOR SELECT USING (true);

CREATE POLICY "Admin modify access to produtos" ON public.produtos
FOR ALL USING (public.is_admin());

-- Módulos: acesso público para leitura, apenas admins para modificação
CREATE POLICY "Public read access to modulos" ON public.modulos
FOR SELECT USING (true);

CREATE POLICY "Admin modify access to modulos" ON public.modulos
FOR ALL USING (public.is_admin());

-- VideoAulas: acesso público para leitura, apenas admins para modificação
CREATE POLICY "Public read access to video_aulas" ON public.video_aulas
FOR SELECT USING (true);

CREATE POLICY "Admin modify access to video_aulas" ON public.video_aulas
FOR ALL USING (public.is_admin());

-- Visualizações: usuários veem apenas suas próprias, admins veem todas
CREATE POLICY "User access to visualizacoes" ON public.visualizacoes_cartorio
FOR SELECT USING (
    public.is_admin() OR cartorio_id = public.get_current_cartorio_id()
);

CREATE POLICY "User create visualizacoes" ON public.visualizacoes_cartorio
FOR INSERT WITH CHECK (cartorio_id = public.get_current_cartorio_id());

CREATE POLICY "User update visualizacoes" ON public.visualizacoes_cartorio
FOR UPDATE USING (
    public.is_admin() OR cartorio_id = public.get_current_cartorio_id()
);

-- Favoritos: usuários veem apenas seus próprios, admins veem todos
CREATE POLICY "User access to favoritos" ON public.favoritos_cartorio
FOR ALL USING (
    public.is_admin() OR cartorio_id = public.get_current_cartorio_id()
);

-- Cartórios: apenas admins podem ver e modificar
CREATE POLICY "Admin access to cartorios" ON public.cartorios
FOR ALL USING (public.is_admin());

-- Acessos de cartório: apenas admins podem ver e modificar
CREATE POLICY "Admin access to acessos_cartorio" ON public.acessos_cartorio
FOR ALL USING (public.is_admin());

-- Usuários de cartório: admins veem todos, cartórios veem apenas seus usuários
CREATE POLICY "Cartorio users access" ON public.cartorio_usuarios
FOR ALL USING (
    public.is_admin() OR cartorio_id = public.get_current_cartorio_id()
);

-- Admins: apenas para funções internas
CREATE POLICY "Admin self access" ON public.admins
FOR ALL USING (public.is_admin());

-- 8. TRIGGER PARA MANTER DADOS CONSISTENTES
-- Trigger para atualizar automaticamente ultima_visualizacao
CREATE OR REPLACE FUNCTION update_ultima_visualizacao_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ultima_visualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_visualizacao ON public.visualizacoes_cartorio;
CREATE TRIGGER trigger_update_visualizacao
    BEFORE UPDATE ON public.visualizacoes_cartorio
    FOR EACH ROW
    EXECUTE FUNCTION update_ultima_visualizacao_trigger();

-- 9. CRIAR DADOS DEMO SE NÃO EXISTIREM
-- Garantir que dados básicos existam para demonstração
INSERT INTO public.cartorios (id, nome, is_active) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Cartório de Demonstração',
    true
) ON CONFLICT (id) DO NOTHING;

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

-- 10. LIMPEZA E OTIMIZAÇÃO FINAL
-- Analisar tabelas para otimizar estatísticas
ANALYZE public.sistemas;
ANALYZE public.produtos;
ANALYZE public.modulos;
ANALYZE public.video_aulas;
ANALYZE public.visualizacoes_cartorio;
ANALYZE public.favoritos_cartorio;
ANALYZE public.cartorios;
ANALYZE public.acessos_cartorio;
ANALYZE public.cartorio_usuarios;
ANALYZE public.admins;
