
-- CORREÇÃO CRÍTICA 1: Remover constraint problemática que impede granularidade
ALTER TABLE cartorio_acesso_conteudo DROP CONSTRAINT IF EXISTS cartorio_acesso_conteudo_check;

-- CORREÇÃO CRÍTICA 2: Habilitar RLS nas tabelas de conteúdo para funcionamento correto
ALTER TABLE sistemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY; 
ALTER TABLE video_aulas ENABLE ROW LEVEL SECURITY;

-- CORREÇÃO CRÍTICA 3: Remover políticas RLS existentes problemáticas
DROP POLICY IF EXISTS "View own accessible systems" ON sistemas;
DROP POLICY IF EXISTS "View own accessible products" ON produtos;
DROP POLICY IF EXISTS "View own accessible video aulas" ON video_aulas;

-- CORREÇÃO CRÍTICA 4: Criar políticas RLS simples e funcionais
-- Política para sistemas: Admin vê tudo, cartório vê baseado em permissões ou tudo se não há restrições
CREATE POLICY "Sistemas access policy"
ON sistemas FOR SELECT
TO authenticated
USING (
    is_admin() 
    OR 
    (
        -- Se não há restrições para este cartório, vê todos os sistemas
        NOT EXISTS (
            SELECT 1 FROM cartorio_acesso_conteudo 
            WHERE cartorio_id = get_current_cartorio_id() AND ativo = true
        )
        OR
        -- Se há restrições, vê apenas sistemas permitidos
        EXISTS (
            SELECT 1 FROM cartorio_acesso_conteudo cac
            WHERE cac.cartorio_id = get_current_cartorio_id()
            AND cac.ativo = true
            AND (
                cac.sistema_id = sistemas.id 
                OR 
                EXISTS (
                    SELECT 1 FROM produtos p 
                    WHERE p.sistema_id = sistemas.id 
                    AND cac.produto_id = p.id
                )
            )
        )
    )
);

-- Política para produtos: Admin vê tudo, cartório vê baseado em permissões ou tudo se não há restrições  
CREATE POLICY "Produtos access policy"
ON produtos FOR SELECT
TO authenticated
USING (
    is_admin()
    OR
    (
        -- Se não há restrições para este cartório, vê todos os produtos
        NOT EXISTS (
            SELECT 1 FROM cartorio_acesso_conteudo 
            WHERE cartorio_id = get_current_cartorio_id() AND ativo = true
        )
        OR
        -- Se há restrições, vê apenas produtos permitidos
        EXISTS (
            SELECT 1 FROM cartorio_acesso_conteudo cac
            WHERE cac.cartorio_id = get_current_cartorio_id()
            AND cac.ativo = true
            AND (
                cac.produto_id = produtos.id
                OR 
                (cac.sistema_id = produtos.sistema_id AND cac.produto_id IS NULL)
            )
        )
    )
);

-- Política para videoaulas: Admin vê tudo, cartório vê baseado em permissões ou tudo se não há restrições
CREATE POLICY "Video aulas access policy" 
ON video_aulas FOR SELECT
TO authenticated
USING (
    is_admin()
    OR
    (
        -- Se não há restrições para este cartório, vê todas as videoaulas
        NOT EXISTS (
            SELECT 1 FROM cartorio_acesso_conteudo 
            WHERE cartorio_id = get_current_cartorio_id() AND ativo = true
        )
        OR
        -- Se há restrições, vê apenas videoaulas de produtos permitidos
        EXISTS (
            SELECT 1 FROM cartorio_acesso_conteudo cac
            JOIN produtos p ON video_aulas.produto_id = p.id
            WHERE cac.cartorio_id = get_current_cartorio_id()
            AND cac.ativo = true
            AND (
                cac.produto_id = p.id
                OR 
                (cac.sistema_id = p.sistema_id AND cac.produto_id IS NULL)
            )
        )
    )
);
