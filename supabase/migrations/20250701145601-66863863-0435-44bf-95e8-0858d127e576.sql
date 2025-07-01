
-- Seção 2: Tabela para controlar o progresso das aulas por cartório
-- A tabela visualizacoes_cartorio já existe, então vamos garantir que ela tem todos os campos necessários
-- e criar índices para performance

-- Verificar se a tabela tem todos os campos necessários (alguns podem já existir)
ALTER TABLE visualizacoes_cartorio 
ADD COLUMN IF NOT EXISTS data_conclusao TIMESTAMP WITH TIME ZONE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_visualizacoes_cartorio_lookup 
ON visualizacoes_cartorio (cartorio_id, video_aula_id);

CREATE INDEX IF NOT EXISTS idx_visualizacoes_completas 
ON visualizacoes_cartorio (cartorio_id, completo) 
WHERE completo = true;

-- Seção 3: Tabela para controlar o acesso de conteúdo por cartório
CREATE TABLE IF NOT EXISTS cartorio_acesso_conteudo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cartorio_id UUID NOT NULL REFERENCES cartorios(id) ON DELETE CASCADE,
    sistema_id UUID REFERENCES sistemas(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
    data_liberacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ativo BOOLEAN NOT NULL DEFAULT true,
    nivel_acesso TEXT DEFAULT 'completo',
    
    -- Constraint para garantir que não temos duplicatas
    UNIQUE(cartorio_id, sistema_id, produto_id),
    
    -- Constraint para garantir que se temos produto_id, também temos sistema_id
    CHECK (
        (produto_id IS NULL) OR 
        (produto_id IS NOT NULL AND sistema_id IS NOT NULL)
    )
);

-- Habilitar RLS na nova tabela
ALTER TABLE cartorio_acesso_conteudo ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cartorio_acesso_conteudo
CREATE POLICY "Admins can manage cartorio access content"
ON cartorio_acesso_conteudo
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Cartorios can view their own access"
ON cartorio_acesso_conteudo
FOR SELECT
TO authenticated
USING (cartorio_id = get_current_cartorio_id());

-- Índices para performance na nova tabela
CREATE INDEX IF NOT EXISTS idx_cartorio_acesso_cartorio 
ON cartorio_acesso_conteudo (cartorio_id, ativo);

CREATE INDEX IF NOT EXISTS idx_cartorio_acesso_sistema 
ON cartorio_acesso_conteudo (sistema_id, ativo);

CREATE INDEX IF NOT EXISTS idx_cartorio_acesso_produto 
ON cartorio_acesso_conteudo (produto_id, ativo);

-- Função para verificar se um cartório tem acesso a um sistema/produto
CREATE OR REPLACE FUNCTION public.cartorio_tem_acesso(
    _cartorio_id UUID,
    _sistema_id UUID DEFAULT NULL,
    _produto_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    -- Se não há restrições definidas para o cartório, permite acesso total
    IF NOT EXISTS (
        SELECT 1 FROM cartorio_acesso_conteudo 
        WHERE cartorio_id = _cartorio_id AND ativo = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar acesso específico
    IF _produto_id IS NOT NULL THEN
        -- Verificar acesso ao produto específico
        RETURN EXISTS (
            SELECT 1 FROM cartorio_acesso_conteudo
            WHERE cartorio_id = _cartorio_id 
            AND produto_id = _produto_id 
            AND ativo = true
        );
    ELSIF _sistema_id IS NOT NULL THEN
        -- Verificar acesso ao sistema (qualquer produto do sistema)
        RETURN EXISTS (
            SELECT 1 FROM cartorio_acesso_conteudo
            WHERE cartorio_id = _cartorio_id 
            AND sistema_id = _sistema_id 
            AND ativo = true
        );
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Atualizar a função update_ultima_visualizacao para incluir data_conclusao
CREATE OR REPLACE FUNCTION public.update_visualizacao_conclusao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.ultima_visualizacao = now();
    
    -- Se está sendo marcado como completo, definir data_conclusao
    IF NEW.completo = true AND OLD.completo = false THEN
        NEW.data_conclusao = now();
    -- Se está sendo desmarcado como completo, limpar data_conclusao
    ELSIF NEW.completo = false AND OLD.completo = true THEN
        NEW.data_conclusao = NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger para atualizar automaticamente os campos de visualização
DROP TRIGGER IF EXISTS trigger_update_visualizacao_conclusao ON visualizacoes_cartorio;
CREATE TRIGGER trigger_update_visualizacao_conclusao
    BEFORE UPDATE ON visualizacoes_cartorio
    FOR EACH ROW
    EXECUTE FUNCTION update_visualizacao_conclusao();
