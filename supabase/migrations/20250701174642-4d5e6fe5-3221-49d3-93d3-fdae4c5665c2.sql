
-- REVERTER: Primeiro remover todos os triggers existentes
DROP TRIGGER IF EXISTS trigger_update_ultima_visualizacao ON visualizacoes_cartorio;
DROP TRIGGER IF EXISTS trigger_update_visualizacao_conclusao ON visualizacoes_cartorio;

-- REVERTER: Remover o CHECK constraint problemático
ALTER TABLE cartorio_acesso_conteudo DROP CONSTRAINT IF EXISTS cartorio_acesso_conteudo_check;

-- REVERTER: Remover a função cartorio_tem_acesso que pode estar causando problemas
DROP FUNCTION IF EXISTS public.cartorio_tem_acesso(UUID, UUID, UUID);

-- REVERTER: Remover as políticas RLS problemáticas
DROP POLICY IF EXISTS "Admins can manage cartorio access content" ON cartorio_acesso_conteudo;
DROP POLICY IF EXISTS "Cartorios can view their own access" ON cartorio_acesso_conteudo;

-- REVERTER: Desabilitar RLS temporariamente na tabela cartorio_acesso_conteudo
ALTER TABLE cartorio_acesso_conteudo DISABLE ROW LEVEL SECURITY;

-- REVERTER: Restaurar função original simples
CREATE OR REPLACE FUNCTION public.update_ultima_visualizacao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.ultima_visualizacao = now();
    RETURN NEW;
END;
$$;

-- REVERTER: Criar trigger simples (agora que removemos os existentes)
CREATE TRIGGER trigger_update_ultima_visualizacao
    BEFORE UPDATE ON visualizacoes_cartorio
    FOR EACH ROW
    EXECUTE FUNCTION update_ultima_visualizacao();

-- REVERTER: Remover constraint UNIQUE problemática se existir
ALTER TABLE cartorio_acesso_conteudo DROP CONSTRAINT IF EXISTS cartorio_acesso_conteudo_cartorio_id_sistema_id_produto_id_key;

-- REVERTER: Limpar dados potencialmente problemáticos
TRUNCATE TABLE cartorio_acesso_conteudo;
