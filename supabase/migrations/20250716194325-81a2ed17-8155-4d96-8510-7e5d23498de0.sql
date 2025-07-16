-- Função para obter visualização específica de um cartório
CREATE OR REPLACE FUNCTION public.get_visualizacao_cartorio(
  p_cartorio_id UUID,
  p_video_aula_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visualizacao RECORD;
  v_result jsonb;
BEGIN
  -- Verificar se o cartório ID é válido
  IF p_cartorio_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cartório ID é obrigatório'
    );
  END IF;
  
  -- Verificar se o video_aula_id é válido
  IF p_video_aula_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Video aula ID é obrigatório'
    );
  END IF;
  
  -- Buscar a visualização
  SELECT completo, concluida, data_conclusao
  INTO v_visualizacao
  FROM public.visualizacoes_cartorio
  WHERE cartorio_id = p_cartorio_id 
    AND video_aula_id = p_video_aula_id;
  
  -- Se não encontrou, retornar padrão
  IF v_visualizacao IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'completo', false,
      'concluida', false,
      'data_conclusao', null,
      'found', false
    );
  END IF;
  
  -- Retornar dados encontrados
  RETURN jsonb_build_object(
    'success', true,
    'completo', COALESCE(v_visualizacao.completo, false),
    'concluida', COALESCE(v_visualizacao.concluida, false),
    'data_conclusao', v_visualizacao.data_conclusao,
    'found', true
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;