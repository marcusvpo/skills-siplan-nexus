-- Criar uma função de teste para verificar configuração do contexto
CREATE OR REPLACE FUNCTION public.test_cartorio_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    result := jsonb_build_object(
        'cartorio_id_jwt', public.get_current_cartorio_id_from_jwt(),
        'cartorio_id_old', public.get_current_cartorio_id(),
        'request_cartorio_id', current_setting('request.cartorio_id', true),
        'app_cartorio_id', current_setting('app.current_cartorio_id', true),
        'auth_uid', auth.uid(),
        'is_admin', public.is_admin()
    );
    
    RETURN result;
END;
$$;