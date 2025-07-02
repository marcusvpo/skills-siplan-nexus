
-- Verificar e corrigir as políticas RLS para visualizacoes_cartorio
-- Primeiro, vamos remover políticas conflitantes que podem estar causando o problema

DROP POLICY IF EXISTS "Cartorio users can insert their own progress" ON public.visualizacoes_cartorio;
DROP POLICY IF EXISTS "Cartorio users can update their own progress" ON public.visualizacoes_cartorio;
DROP POLICY IF EXISTS "Cartorio users can view their own progress" ON public.visualizacoes_cartorio;
DROP POLICY IF EXISTS "Admins can manage all progress" ON public.visualizacoes_cartorio;

-- Recriar políticas mais permissivas e funcionais
-- Política para SELECT - usuários veem apenas seus próprios registros
CREATE POLICY "Users can view their own visualizacoes" 
ON public.visualizacoes_cartorio
FOR SELECT 
USING (
  public.is_admin() OR 
  cartorio_id = public.get_current_cartorio_id()
);

-- Política para INSERT - usuários podem inserir apenas para seu próprio cartório
CREATE POLICY "Users can create their own visualizacoes" 
ON public.visualizacoes_cartorio
FOR INSERT 
WITH CHECK (
  cartorio_id = public.get_current_cartorio_id()
);

-- Política para UPDATE - usuários podem atualizar apenas seus próprios registros
CREATE POLICY "Users can update their own visualizacoes" 
ON public.visualizacoes_cartorio
FOR UPDATE 
USING (
  public.is_admin() OR 
  cartorio_id = public.get_current_cartorio_id()
)
WITH CHECK (
  cartorio_id = public.get_current_cartorio_id()
);

-- Política para DELETE - apenas admins podem deletar
CREATE POLICY "Admins can delete visualizacoes" 
ON public.visualizacoes_cartorio
FOR DELETE 
USING (public.is_admin());

-- Garantir que a função get_current_cartorio_id funciona corretamente
-- Vamos melhorar a função para ser mais robusta
CREATE OR REPLACE FUNCTION public.get_current_cartorio_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
    cartorio_uuid UUID;
    jwt_payload JSONB;
    auth_header TEXT;
    token TEXT;
    custom_header TEXT;
BEGIN
    -- Primeiro: tentar extrair do JWT customizado
    BEGIN
        jwt_payload := current_setting('request.jwt.claims', true)::jsonb;
        IF jwt_payload IS NOT NULL THEN
            cartorio_uuid := (jwt_payload ->> 'cartorio_id')::UUID;
            
            IF cartorio_uuid IS NOT NULL THEN
                -- Verificar se o cartório existe e está ativo
                SELECT id INTO cartorio_uuid
                FROM public.cartorios 
                WHERE id = cartorio_uuid AND is_active = true;
                
                IF cartorio_uuid IS NOT NULL THEN
                    RETURN cartorio_uuid;
                END IF;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;
    
    -- Segundo: verificar header customizado X-Custom-Auth
    BEGIN
        custom_header := current_setting('request.headers', true)::json->>'x-custom-auth';
        IF custom_header IS NOT NULL AND custom_header LIKE 'CART-%' THEN
            SELECT ac.cartorio_id INTO cartorio_uuid
            FROM public.acessos_cartorio ac
            INNER JOIN public.cartorios c ON c.id = ac.cartorio_id
            WHERE ac.login_token = custom_header
            AND ac.ativo = true 
            AND ac.data_expiracao > now()
            AND c.is_active = true;
            
            IF cartorio_uuid IS NOT NULL THEN
                RETURN cartorio_uuid;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;
    
    -- Terceiro: verificar token customizado via header Authorization
    BEGIN
        auth_header := current_setting('request.headers', true)::json->>'authorization';
        IF auth_header IS NOT NULL THEN
            IF auth_header LIKE 'Bearer CART-%' THEN
                token := replace(auth_header, 'Bearer ', '');
                
                SELECT ac.cartorio_id INTO cartorio_uuid
                FROM public.acessos_cartorio ac
                INNER JOIN public.cartorios c ON c.id = ac.cartorio_id
                WHERE ac.login_token = token 
                AND ac.ativo = true 
                AND ac.data_expiracao > now()
                AND c.is_active = true;
                
                IF cartorio_uuid IS NOT NULL THEN
                    RETURN cartorio_uuid;
                END IF;
                
            ELSIF auth_header = 'Bearer DEMO-SIPLANSKILLS-CARTORIO' THEN
                -- Token demo especial
                SELECT id INTO cartorio_uuid 
                FROM public.cartorios 
                WHERE nome = 'Cartório de Demonstração' 
                AND is_active = true
                LIMIT 1;
                
                IF cartorio_uuid IS NOT NULL THEN
                    RETURN cartorio_uuid;
                END IF;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;
    
    RETURN NULL;
END;
$$;

-- Adicionar constraint para evitar dados inconsistentes
ALTER TABLE public.visualizacoes_cartorio 
ADD CONSTRAINT IF NOT EXISTS unique_cartorio_video_aula 
UNIQUE (cartorio_id, video_aula_id);

-- Garantir que a tabela tenha o trigger para atualizar data_conclusao
CREATE OR REPLACE FUNCTION public.update_visualizacao_conclusao()
RETURNS TRIGGER AS $$
BEGIN
    -- Se está sendo marcado como completo, definir data_conclusao
    IF NEW.completo = true AND (OLD.completo IS NULL OR OLD.completo = false) THEN
        NEW.data_conclusao = now();
    -- Se está sendo desmarcado como completo, limpar data_conclusao
    ELSIF NEW.completo = false AND OLD.completo = true THEN
        NEW.data_conclusao = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger
DROP TRIGGER IF EXISTS trigger_update_visualizacao_conclusao ON public.visualizacoes_cartorio;
CREATE TRIGGER trigger_update_visualizacao_conclusao
    BEFORE UPDATE ON public.visualizacoes_cartorio
    FOR EACH ROW
    EXECUTE FUNCTION public.update_visualizacao_conclusao();
