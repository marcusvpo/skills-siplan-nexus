-- Atualizar a função set_cartorio_context para melhor persistência
CREATE OR REPLACE FUNCTION public.set_cartorio_context(p_cartorio_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Setar na sessão (persiste até o final da sessão)
    PERFORM set_config('request.cartorio_id', p_cartorio_id::text, false);
    
    -- Setar como configuração de aplicação (alternativa)
    PERFORM set_config('app.current_cartorio_id', p_cartorio_id::text, false);
END;
$$;