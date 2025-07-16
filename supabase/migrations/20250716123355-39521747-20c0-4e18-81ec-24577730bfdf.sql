-- Configurar RLS para visualizacoes_cartorio adequadamente
-- Primeiro, garantir que RLS está ativado
ALTER TABLE public.visualizacoes_cartorio ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Admins can manage all progress" ON public.visualizacoes_cartorio;
DROP POLICY IF EXISTS "Users can insert their own visualizations" ON public.visualizacoes_cartorio;
DROP POLICY IF EXISTS "Users can update their own visualizations" ON public.visualizacoes_cartorio;
DROP POLICY IF EXISTS "Users can view their own visualizations" ON public.visualizacoes_cartorio;

-- Criar função para obter cartorio_id do contexto atual
CREATE OR REPLACE FUNCTION public.get_current_cartorio_id_from_jwt()
RETURNS UUID AS $$
DECLARE
    jwt_payload JSONB;
    cartorio_id UUID;
BEGIN
    -- Primeiro, tentar obter do JWT customizado
    BEGIN
        jwt_payload := current_setting('request.jwt.claims', true)::jsonb;
        IF jwt_payload IS NOT NULL THEN
            cartorio_id := (jwt_payload ->> 'cartorio_id')::UUID;
            IF cartorio_id IS NOT NULL THEN
                RETURN cartorio_id;
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Se não encontrou no JWT, tentar obter via setting de sessão
    BEGIN
        cartorio_id := current_setting('request.cartorio_id', true)::UUID;
        IF cartorio_id IS NOT NULL THEN
            RETURN cartorio_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Fallback para função existente
    RETURN public.get_current_cartorio_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Criar função RPC para setar cartorio_id na sessão
CREATE OR REPLACE FUNCTION public.set_cartorio_context(p_cartorio_id UUID)
RETURNS void AS $$
BEGIN
    PERFORM set_config('request.cartorio_id', p_cartorio_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar políticas RLS mais robustas
CREATE POLICY "Admins can manage all visualizacoes"
ON public.visualizacoes_cartorio
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Cartorios can manage their own visualizacoes"
ON public.visualizacoes_cartorio
FOR ALL
USING (
    cartorio_id = public.get_current_cartorio_id_from_jwt()
    OR public.is_admin()
)
WITH CHECK (
    cartorio_id = public.get_current_cartorio_id_from_jwt()
    OR public.is_admin()
);

-- Garantir que a função registrar_visualizacao_cartorio funcione corretamente
CREATE OR REPLACE FUNCTION public.registrar_visualizacao_cartorio_robust(
    p_video_aula_id UUID,
    p_completo BOOLEAN DEFAULT false,
    p_concluida BOOLEAN DEFAULT false,
    p_data_conclusao TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_cartorio_id UUID;
    v_id UUID;
    v_existing_id UUID;
BEGIN
    -- Obter cartorio_id do contexto atual
    v_cartorio_id := public.get_current_cartorio_id_from_jwt();
    
    -- Verificar se conseguiu obter o cartorio_id
    IF v_cartorio_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cartório não identificado. Verifique se o contexto foi configurado corretamente.',
            'detail', 'AUTH_CONTEXT_ERROR'
        );
    END IF;
    
    -- Verificar se o vídeo existe
    IF NOT EXISTS (SELECT 1 FROM public.video_aulas WHERE id = p_video_aula_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Vídeo-aula não encontrada',
            'detail', 'NOT_FOUND'
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
            'action', 'update'
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
            'action', 'insert'
        );
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE,
        'cartorio_id', v_cartorio_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;