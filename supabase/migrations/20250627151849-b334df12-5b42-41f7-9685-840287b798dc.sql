
-- Criar políticas RLS para a tabela cartorios
CREATE POLICY "Admins can view all cartorios" 
ON public.cartorios 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can insert cartorios" 
ON public.cartorios 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update cartorios" 
ON public.cartorios 
FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admins can delete cartorios" 
ON public.cartorios 
FOR DELETE 
USING (public.is_admin());

-- Criar políticas RLS para a tabela acessos_cartorio
CREATE POLICY "Admins can view all acessos_cartorio" 
ON public.acessos_cartorio 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can insert acessos_cartorio" 
ON public.acessos_cartorio 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update acessos_cartorio" 
ON public.acessos_cartorio 
FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admins can delete acessos_cartorio" 
ON public.acessos_cartorio 
FOR DELETE 
USING (public.is_admin());

-- Criar políticas RLS para a tabela video_aulas
CREATE POLICY "Admins can view all video_aulas" 
ON public.video_aulas 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can insert video_aulas" 
ON public.video_aulas 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update video_aulas" 
ON public.video_aulas 
FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admins can delete video_aulas" 
ON public.video_aulas 
FOR DELETE 
USING (public.is_admin());

-- Criar políticas RLS para a tabela cartorio_usuarios
CREATE POLICY "Admins can view all cartorio_usuarios" 
ON public.cartorio_usuarios 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can insert cartorio_usuarios" 
ON public.cartorio_usuarios 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update cartorio_usuarios" 
ON public.cartorio_usuarios 
FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admins can delete cartorio_usuarios" 
ON public.cartorio_usuarios 
FOR DELETE 
USING (public.is_admin());

-- Habilitar RLS nas tabelas que ainda não têm
ALTER TABLE public.cartorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acessos_cartorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartorio_usuarios ENABLE ROW LEVEL SECURITY;
