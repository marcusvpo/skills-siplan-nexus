
-- Primeiro, remover a constraint existente
ALTER TABLE public.user_video_progress DROP CONSTRAINT user_video_progress_user_id_fkey;

-- Alterar a referência para cartorio_usuarios
ALTER TABLE public.user_video_progress 
ADD CONSTRAINT user_video_progress_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.cartorio_usuarios(id);
