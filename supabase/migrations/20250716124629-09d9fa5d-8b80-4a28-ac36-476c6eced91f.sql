-- Melhorar a função registrar_visualizacao_cartorio_robust com melhor diagnóstico
CREATE OR REPLACE FUNCTION public.registrar_visualizacao_cartorio_robust(
    p_video_aula_id uuid, 
    p_completo boolean DEFAULT false, 
    p_concluida boolean DEFAULT false, 
    p_data_conclusao timestamp with time zone DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cartorio_id UUID;
    v_id UUID;
    v_existing_id UUID;
    v_debug_info TEXT;
BEGIN
    -- Obter cartorio_id do contexto atual com melhor diagnóstico
    BEGIN
        v_cartorio_id := public.get_current_cartorio_id_from_jwt();
        
        -- Se ainda não encontrou, tentar current_setting
        IF v_cartorio_id IS NULL THEN
            BEGIN
                v_cartorio_id := current_setting('request.cartorio_id', true)::UUID;
            EXCEPTION WHEN OTHERS THEN
                v_cartorio_id := NULL;
            END;
        END IF;
        
        -- Debug: coletar informações do contexto
        v_debug_info := format('JWT: %s, Setting: %s, Auth: %s', 
            COALESCE(public.get_current_cartorio_id_from_jwt()::TEXT, 'NULL'),
            COALESCE(current_setting('request.cartorio_id', true), 'NULL'),
            COALESCE(auth.uid()::TEXT, 'NULL')
        );
        
    EXCEPTION WHEN OTHERS THEN
        v_debug_info := 'Erro ao obter contexto: ' || SQLERRM;
    END;
    
    -- Verificar se conseguiu obter o cartorio_id
    IF v_cartorio_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cartório não identificado. Verifique se o contexto foi configurado corretamente.',
            'detail', 'AUTH_CONTEXT_ERROR',
            'debug', v_debug_info
        );
    END IF;
    
    -- Verificar se o vídeo existe
    IF NOT EXISTS (SELECT 1 FROM public.video_aulas WHERE id = p_video_aula_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Vídeo-aula não encontrada',
            'detail', 'NOT_FOUND',
            'debug', v_debug_info
        );
    END IF;
    
    -- Verificar se já existe registro
    SELECT id INTO v_existing_id
    FROM public.visualizacoes_cartorio
    WHERE cartorio_id = v_cartorio_id AND video_aula_id = p_video_aula_id;
    
    IF v_existing_id IS NOT NULL THEN
        -- Atualizar registro existente
        UPDATE public.visualizacoes_cartorio
        SET 
            completo = p_completo,
            concluida = p_concluida,
            data_conclusao = CASE 
                WHEN p_concluida = true AND data_conclusao IS NULL THEN CURRENT_TIMESTAMP
                WHEN p_concluida = false THEN NULL
                ELSE p_data_conclusao
            END
        WHERE id = v_existing_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'id', v_existing_id,
            'cartorio_id', v_cartorio_id,
            'message', 'Registro atualizado com sucesso',
            'action', 'update',
            'debug', v_debug_info
        );
    ELSE
        -- Inserir novo registro
        INSERT INTO public.visualizacoes_cartorio (
            id,
            cartorio_id,
            video_aula_id,
            completo,
            concluida,
            data_conclusao
        ) VALUES (
            gen_random_uuid(),
            v_cartorio_id,
            p_video_aula_id,
            p_completo,
            p_concluida,
            CASE 
                WHEN p_concluida = true THEN CURRENT_TIMESTAMP
                ELSE p_data_conclusao
            END
        ) RETURNING id INTO v_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'id', v_id,
            'cartorio_id', v_cartorio_id,
            'message', 'Registro inserido com sucesso',
            'action', 'insert',
            'debug', v_debug_info
        );
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE,
        'cartorio_id', v_cartorio_id,
        'debug', v_debug_info
    );
END;
$$;