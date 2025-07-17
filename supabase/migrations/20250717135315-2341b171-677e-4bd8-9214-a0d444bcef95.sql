-- Adicionar constraint única para garantir que cada usuário tenha apenas um registro por vídeo aula
-- Primeiro, vamos limpar possíveis duplicatas existentes
DELETE FROM public.visualizacoes_cartorio v1 
WHERE EXISTS (
  SELECT 1 FROM public.visualizacoes_cartorio v2 
  WHERE v2.video_aula_id = v1.video_aula_id 
  AND v2.cartorio_id = v1.cartorio_id 
  AND v2.user_id = v1.user_id 
  AND v2.id < v1.id
);

-- Adicionar constraint única incluindo user_id
ALTER TABLE public.visualizacoes_cartorio 
ADD CONSTRAINT unique_user_video_cartorio 
UNIQUE (user_id, video_aula_id, cartorio_id);