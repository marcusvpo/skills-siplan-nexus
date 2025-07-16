-- Criar uma função aprimorada para obter o cartorio_id do JWT personalizado
CREATE OR REPLACE FUNCTION public.get_current_cartorio_id_from_jwt()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
    jwt_payload JSONB;
    cartorio_id UUID;
    auth_header TEXT;
    token_parts TEXT[];
    decoded_payload JSONB;
BEGIN
    -- Método 1: Tentar obter do JWT customizado via request.jwt.claims
    BEGIN
        jwt_payload := current_setting('request.jwt.claims', true)::jsonb;
        
        -- Verificar se é um JWT de cartório (tem cartorio_id)
        IF jwt_payload IS NOT NULL THEN
            cartorio_id := (jwt_payload ->> 'cartorio_id')::UUID;
            IF cartorio_id IS NOT NULL THEN
                RETURN cartorio_id;
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Método 2: Tentar obter via setting de sessão
    BEGIN
        cartorio_id := current_setting('request.cartorio_id', true)::UUID;
        IF cartorio_id IS NOT NULL THEN
            RETURN cartorio_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Método 3: Tentar obter via contexto de aplicação
    BEGIN
        cartorio_id := current_setting('app.current_cartorio_id', true)::UUID;
        IF cartorio_id IS NOT NULL THEN
            RETURN cartorio_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Método 4: Fallback para função existente
    BEGIN
        cartorio_id := public.get_current_cartorio_id();
        IF cartorio_id IS NOT NULL THEN
            RETURN cartorio_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Se chegou aqui, não encontrou o cartorio_id
    RETURN NULL;
END;
$$;