-- Função corrigida para buscar progresso individual respeitando permissões do cartório
CREATE OR REPLACE FUNCTION public.get_user_progress_by_cartorio_with_permissions(p_cartorio_id uuid)
RETURNS TABLE (
    user_id uuid,
    username text,
    email text,
    is_active boolean,
    produto_id uuid,
    produto_nome text,
    sistema_nome text,
    total_aulas bigint,
    aulas_concluidas bigint,
    percentual numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cu.id as user_id,
        cu.username,
        cu.email,
        cu.is_active,
        p.id as produto_id,
        p.nome as produto_nome,
        s.nome as sistema_nome,
        COUNT(va.id) as total_aulas,
        COUNT(CASE WHEN vc.completo = true THEN 1 END) as aulas_concluidas,
        CASE 
            WHEN COUNT(va.id) = 0 THEN 0
            ELSE ROUND((COUNT(CASE WHEN vc.completo = true THEN 1 END) * 100.0) / COUNT(va.id), 0)
        END as percentual
    FROM 
        public.cartorio_usuarios cu
        CROSS JOIN (
            -- Subquery para produtos liberados para o cartório
            SELECT DISTINCT p.id, p.nome, p.sistema_id
            FROM public.produtos p
            INNER JOIN public.sistemas s ON p.sistema_id = s.id
            WHERE (
                -- Se não há permissões específicas, libera tudo
                NOT EXISTS (
                    SELECT 1 FROM public.cartorio_acesso_conteudo 
                    WHERE cartorio_id = p_cartorio_id AND ativo = true
                )
                OR
                -- Se há permissões específicas, verifica se o produto está liberado
                EXISTS (
                    SELECT 1 FROM public.cartorio_acesso_conteudo cac
                    WHERE cac.cartorio_id = p_cartorio_id 
                    AND cac.ativo = true
                    AND (
                        -- Produto liberado especificamente
                        cac.produto_id = p.id
                        OR 
                        -- Sistema liberado (todos os produtos do sistema)
                        (cac.sistema_id = p.sistema_id AND cac.produto_id IS NULL)
                    )
                )
            )
        ) p
        INNER JOIN public.sistemas s ON p.sistema_id = s.id
        LEFT JOIN public.video_aulas va ON va.produto_id = p.id
        LEFT JOIN public.visualizacoes_cartorio vc ON vc.video_aula_id = va.id AND vc.cartorio_id = p_cartorio_id
    WHERE 
        cu.cartorio_id = p_cartorio_id
        AND cu.is_active = true
    GROUP BY 
        cu.id, cu.username, cu.email, cu.is_active, p.id, p.nome, s.nome
    ORDER BY 
        cu.username, s.nome, p.nome;
END;
$$;