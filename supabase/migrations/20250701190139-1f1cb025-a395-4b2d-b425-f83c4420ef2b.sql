
-- Step 1.1: Find and drop the problematic CHECK constraint
-- First, let's find the constraint name
SELECT conname
FROM pg_constraint
WHERE conrelid = 'public.cartorio_acesso_conteudo'::regclass
AND contype = 'c';

-- Drop the constraint (replace with actual name found above)
ALTER TABLE public.cartorio_acesso_conteudo DROP CONSTRAINT IF EXISTS cartorio_acesso_conteudo_check;

-- Step 1.2: Create/update RLS helper functions
-- Note: These functions are updated to work with your existing schema structure
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_uuid UUID;
    is_admin_user BOOLEAN := FALSE;
    jwt_payload JSONB;
BEGIN
    -- First: verificar se é admin via Supabase Auth
    user_uuid := auth.uid();
    
    IF user_uuid IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 
            FROM public.admins 
            WHERE id = user_uuid
        ) INTO is_admin_user;
        
        IF is_admin_user THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Second: verificar via JWT customizado
    BEGIN
        jwt_payload := current_setting('request.jwt.claims', true)::jsonb;
        IF jwt_payload IS NOT NULL THEN
            -- Verificar se tem role admin no JWT
            IF (jwt_payload ->> 'role') = 'admin' THEN
                RETURN TRUE;
            END IF;
            
            -- Verificar admin via email no JWT
            SELECT EXISTS (
                SELECT 1 
                FROM public.admins 
                WHERE email = (jwt_payload ->> 'email')
            ) INTO is_admin_user;
            
            IF is_admin_user THEN
                RETURN TRUE;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Em caso de erro, continuar com FALSE
            NULL;
    END;
    
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_cartorio_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
    cartorio_uuid UUID;
    jwt_payload JSONB;
    auth_header TEXT;
    token TEXT;
BEGIN
    -- Primeiro: tentar extrair do JWT customizado
    BEGIN
        jwt_payload := current_setting('request.jwt.claims', true)::jsonb;
        IF jwt_payload IS NOT NULL THEN
            cartorio_uuid := (jwt_payload ->> 'cartorio_id')::UUID;
            
            IF cartorio_uuid IS NOT NULL THEN
                -- Verificar se o cartório existe e está ativo
                SELECT id INTO cartorio_uuid
                FROM public.cartorios 
                WHERE id = cartorio_uuid AND is_active = true;
                
                IF cartorio_uuid IS NOT NULL THEN
                    RETURN cartorio_uuid;
                END IF;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;
    
    -- Segundo: verificar token customizado via header
    BEGIN
        auth_header := current_setting('request.headers', true)::json->>'authorization';
        IF auth_header IS NOT NULL THEN
            IF auth_header LIKE 'Bearer CART-%' THEN
                token := replace(auth_header, 'Bearer ', '');
                
                SELECT ac.cartorio_id INTO cartorio_uuid
                FROM public.acessos_cartorio ac
                INNER JOIN public.cartorios c ON c.id = ac.cartorio_id
                WHERE ac.login_token = token 
                AND ac.ativo = true 
                AND ac.data_expiracao > now()
                AND c.is_active = true;
                
                IF cartorio_uuid IS NOT NULL THEN
                    RETURN cartorio_uuid;
                END IF;
                
            ELSIF auth_header = 'Bearer DEMO-SIPLANSKILLS-CARTORIO' THEN
                -- Token demo especial
                SELECT id INTO cartorio_uuid 
                FROM public.cartorios 
                WHERE nome = 'Cartório de Demonstração' 
                AND is_active = true
                LIMIT 1;
                
                IF cartorio_uuid IS NOT NULL THEN
                    RETURN cartorio_uuid;
                END IF;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;
    
    RETURN NULL;
END;
$$;

-- Step 1.3: Enable RLS on relevant tables
ALTER TABLE public.sistemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartorio_acesso_conteudo ENABLE ROW LEVEL SECURITY;

-- Step 1.4: Drop existing conflicting policies first
DROP POLICY IF EXISTS "View own accessible systems" ON public.sistemas;
DROP POLICY IF EXISTS "View own accessible products" ON public.produtos;
DROP POLICY IF EXISTS "View own accessible video aulas" ON public.video_aulas;
DROP POLICY IF EXISTS "Cartorios can view their own access" ON public.cartorio_acesso_conteudo;
DROP POLICY IF EXISTS "Admins can manage access rules" ON public.cartorio_acesso_conteudo;

-- Create new robust RLS policies
CREATE POLICY "View own accessible systems"
ON public.sistemas
FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR
    EXISTS (
        SELECT 1
        FROM public.cartorio_acesso_conteudo cac
        WHERE cac.cartorio_id = public.get_current_cartorio_id()
        AND cac.ativo = TRUE
        AND (
            (cac.sistema_id = public.sistemas.id AND cac.produto_id IS NULL)
            OR
            (cac.produto_id IN (SELECT p.id FROM public.produtos p WHERE p.sistema_id = public.sistemas.id AND cac.produto_id = p.id))
        )
    )
    OR NOT EXISTS (SELECT 1 FROM public.cartorio_acesso_conteudo WHERE cartorio_id = public.get_current_cartorio_id() AND ativo = TRUE)
);

CREATE POLICY "View own accessible products"
ON public.produtos
FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR
    EXISTS (
        SELECT 1
        FROM public.cartorio_acesso_conteudo cac
        WHERE cac.cartorio_id = public.get_current_cartorio_id()
        AND cac.ativo = TRUE
        AND (
            (cac.produto_id = public.produtos.id)
            OR
            (cac.sistema_id = public.produtos.sistema_id AND cac.produto_id IS NULL)
        )
    )
    OR NOT EXISTS (SELECT 1 FROM public.cartorio_acesso_conteudo WHERE cartorio_id = public.get_current_cartorio_id() AND ativo = TRUE)
);

CREATE POLICY "View own accessible video aulas"
ON public.video_aulas
FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR
    EXISTS (
        SELECT 1
        FROM public.cartorio_acesso_conteudo cac
        JOIN public.produtos p ON public.video_aulas.produto_id = p.id
        WHERE cac.cartorio_id = public.get_current_cartorio_id()
        AND cac.ativo = TRUE
        AND (
            (cac.produto_id = p.id)
            OR
            (cac.sistema_id = p.sistema_id AND cac.produto_id IS NULL)
        )
    )
    OR NOT EXISTS (SELECT 1 FROM public.cartorio_acesso_conteudo WHERE cartorio_id = public.get_current_cartorio_id() AND ativo = TRUE)
);

-- Policies for cartorio_acesso_conteudo (Access Management Table)
CREATE POLICY "Cartorios can view their own access"
ON public.cartorio_acesso_conteudo
FOR SELECT
TO authenticated
USING (cartorio_id = public.get_current_cartorio_id());

CREATE POLICY "Admins can manage access rules"
ON public.cartorio_acesso_conteudo
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
