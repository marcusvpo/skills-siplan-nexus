
-- Corrigir as políticas RLS para permitir que usuários autenticados vejam sistemas, produtos e videoaulas
-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Administradores podem ver todos os sistemas" ON public.sistemas;
DROP POLICY IF EXISTS "Administradores podem gerenciar sistemas" ON public.sistemas;
DROP POLICY IF EXISTS "Administradores podem ver todos os produtos" ON public.produtos;
DROP POLICY IF EXISTS "Administradores podem gerenciar produtos" ON public.produtos;
DROP POLICY IF EXISTS "Administradores podem ver todos os modulos" ON public.modulos;
DROP POLICY IF EXISTS "Administradores podem gerenciar modulos" ON public.modulos;
DROP POLICY IF EXISTS "Administradores podem ver todas as videoaulas" ON public.video_aulas;
DROP POLICY IF EXISTS "Administradores podem gerenciar videoaulas" ON public.video_aulas;

-- Ativar RLS nas tabelas
ALTER TABLE public.sistemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visualizacoes_cartorio ENABLE ROW LEVEL SECURITY;

-- Políticas para sistemas (acesso para todos os usuários autenticados)
CREATE POLICY "Todos podem ver sistemas" ON public.sistemas
FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem modificar sistemas" ON public.sistemas
FOR ALL USING (public.is_admin());

-- Políticas para produtos
CREATE POLICY "Todos podem ver produtos" ON public.produtos
FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem modificar produtos" ON public.produtos
FOR ALL USING (public.is_admin());

-- Políticas para módulos
CREATE POLICY "Todos podem ver modulos" ON public.modulos
FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem modificar modulos" ON public.modulos
FOR ALL USING (public.is_admin());

-- Políticas para videoaulas
CREATE POLICY "Todos podem ver videoaulas" ON public.video_aulas
FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem modificar videoaulas" ON public.video_aulas
FOR ALL USING (public.is_admin());

-- Políticas para visualizações (usuários só veem suas próprias)
CREATE POLICY "Usuarios veem suas visualizacoes" ON public.visualizacoes_cartorio
FOR SELECT USING (
  CASE 
    WHEN public.is_admin() THEN true
    ELSE cartorio_id = public.get_current_cartorio_id()
  END
);

CREATE POLICY "Usuarios podem criar visualizacoes" ON public.visualizacoes_cartorio
FOR INSERT WITH CHECK (cartorio_id = public.get_current_cartorio_id());

CREATE POLICY "Usuarios podem atualizar suas visualizacoes" ON public.visualizacoes_cartorio
FOR UPDATE USING (cartorio_id = public.get_current_cartorio_id());

-- Melhorar a função get_current_cartorio_id para lidar com tokens customizados
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
    -- Tentar extrair do JWT customizado primeiro
    BEGIN
        jwt_payload := current_setting('request.jwt.claims', true)::jsonb;
        cartorio_uuid := (jwt_payload ->> 'cartorio_id')::UUID;
        
        IF cartorio_uuid IS NOT NULL THEN
            RETURN cartorio_uuid;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Continuar para verificação de token customizado
    END;
    
    -- Verificar se é um token customizado do cartório via header
    BEGIN
        auth_header := current_setting('request.headers', true)::json->>'authorization';
        IF auth_header IS NOT NULL AND auth_header LIKE 'Bearer CART-%' THEN
            token := replace(auth_header, 'Bearer ', '');
            
            SELECT ac.cartorio_id INTO cartorio_uuid
            FROM public.acessos_cartorio ac
            WHERE ac.login_token = token 
            AND ac.ativo = true 
            AND ac.data_expiracao > now();
            
            RETURN cartorio_uuid;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Ignorar erros e retornar null
    END;
    
    RETURN NULL;
END;
$function$;

-- Adicionar trigger para atualizar automaticamente última visualização
CREATE OR REPLACE FUNCTION update_ultima_visualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ultima_visualizacao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ultima_visualizacao ON public.visualizacoes_cartorio;
CREATE TRIGGER trigger_update_ultima_visualizacao
    BEFORE UPDATE ON public.visualizacoes_cartorio
    FOR EACH ROW
    EXECUTE FUNCTION update_ultima_visualizacao();
