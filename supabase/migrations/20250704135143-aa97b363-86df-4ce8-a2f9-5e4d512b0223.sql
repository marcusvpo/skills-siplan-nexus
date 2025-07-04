
-- Remover completamente a tabela visualizacoes_cartorio
DROP TABLE IF EXISTS public.visualizacoes_cartorio CASCADE;

-- Remover função de progresso do produto
DROP FUNCTION IF EXISTS public.get_product_progress(UUID, UUID);

-- Remover funções relacionadas a visualizações
DROP FUNCTION IF EXISTS public.update_visualizacao_conclusao();
DROP FUNCTION IF EXISTS public.registrar_visualizacao_cartorio(UUID, BOOLEAN, BOOLEAN, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS public.test_insert_visualizacao_cartorio(UUID, UUID, BOOLEAN, BOOLEAN, TIMESTAMP WITH TIME ZONE);

-- Remover triggers relacionados
DROP TRIGGER IF EXISTS trigger_update_visualizacao_conclusao ON public.visualizacoes_cartorio;

-- Limpar registros de debug relacionados se existirem
DELETE FROM public.rls_debug_log WHERE message LIKE '%visualizacao%' OR message LIKE '%progress%';
