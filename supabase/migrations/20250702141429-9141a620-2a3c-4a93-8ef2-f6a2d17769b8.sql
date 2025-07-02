
-- LIMPEZA TOTAL: Remover dados existentes e políticas RLS problemáticas
DELETE FROM visualizacoes_cartorio;

-- Remover todas as políticas RLS existentes da tabela visualizacoes_cartorio
DROP POLICY IF EXISTS "Admins can view all progress" ON visualizacoes_cartorio;
DROP POLICY IF EXISTS "Cartorios can manage their own visualizacoes" ON visualizacoes_cartorio;
DROP POLICY IF EXISTS "User access to visualizacoes" ON visualizacoes_cartorio;
DROP POLICY IF EXISTS "User create visualizacoes" ON visualizacoes_cartorio;
DROP POLICY IF EXISTS "User update visualizacoes" ON visualizacoes_cartorio;
DROP POLICY IF EXISTS "Users can update their own progress" ON visualizacoes_cartorio;
DROP POLICY IF EXISTS "Users can view their own progress" ON visualizacoes_cartorio;
DROP POLICY IF EXISTS "Usuarios podem atualizar suas visualizacoes" ON visualizacoes_cartorio;
DROP POLICY IF EXISTS "Usuarios podem criar visualizacoes" ON visualizacoes_cartorio;
DROP POLICY IF EXISTS "Usuarios veem suas visualizacoes" ON visualizacoes_cartorio;

-- Simplificar a estrutura da tabela visualizacoes_cartorio
ALTER TABLE visualizacoes_cartorio 
DROP COLUMN IF EXISTS progresso_segundos,
DROP COLUMN IF EXISTS ultima_visualizacao,
DROP COLUMN IF EXISTS cartorio_usuario_id;

-- Garantir que temos os campos essenciais
ALTER TABLE visualizacoes_cartorio 
ADD COLUMN IF NOT EXISTS concluida BOOLEAN DEFAULT FALSE,
ALTER COLUMN completo SET DEFAULT FALSE;

-- Renomear 'completo' para 'concluida' se necessário (manter consistência)
-- Usar 'completo' existente como 'concluida'

-- NOVAS POLÍTICAS RLS SIMPLIFICADAS E FUNCIONAIS
CREATE POLICY "Cartorio users can view their own progress"
ON visualizacoes_cartorio
FOR SELECT
TO authenticated
USING (cartorio_id = get_current_cartorio_id());

CREATE POLICY "Cartorio users can insert their own progress"
ON visualizacoes_cartorio
FOR INSERT
TO authenticated
WITH CHECK (cartorio_id = get_current_cartorio_id());

CREATE POLICY "Cartorio users can update their own progress"
ON visualizacoes_cartorio
FOR UPDATE
TO authenticated
USING (cartorio_id = get_current_cartorio_id())
WITH CHECK (cartorio_id = get_current_cartorio_id());

CREATE POLICY "Admins can manage all progress"
ON visualizacoes_cartorio
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Função para calcular progresso do produto
CREATE OR REPLACE FUNCTION get_product_progress(p_produto_id UUID, p_cartorio_id UUID)
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_aulas', COUNT(va.id),
    'aulas_concluidas', COALESCE(SUM(CASE WHEN vc.completo = true THEN 1 ELSE 0 END), 0),
    'percentual', CASE 
      WHEN COUNT(va.id) = 0 THEN 0 
      ELSE ROUND((COALESCE(SUM(CASE WHEN vc.completo = true THEN 1 ELSE 0 END), 0) * 100.0) / COUNT(va.id), 0)
    END
  )
  FROM video_aulas va
  LEFT JOIN visualizacoes_cartorio vc 
    ON va.id = vc.video_aula_id AND vc.cartorio_id = p_cartorio_id
  WHERE va.produto_id = p_produto_id;
$$;
