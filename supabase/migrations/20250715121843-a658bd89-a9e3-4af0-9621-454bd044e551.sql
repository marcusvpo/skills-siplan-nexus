
-- Criar tabela simples para acompanhamento de progresso de videoaulas
CREATE TABLE public.user_video_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  video_aula_id uuid REFERENCES video_aulas(id),
  completed boolean DEFAULT false,
  completed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, video_aula_id)
);

-- Adicionar índices para performance
CREATE INDEX idx_user_video_progress_user_id ON public.user_video_progress(user_id);
CREATE INDEX idx_user_video_progress_video_aula_id ON public.user_video_progress(video_aula_id);
