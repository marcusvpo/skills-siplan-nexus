-- Brick 1: Criar tabelas para o módulo de Trilhas, Quizzes e Certificados

-- Tabela para definir as Trilhas de Aprendizagem
CREATE TABLE public.trilhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de associação (Muitos-para-Muitos) entre Trilhas e VideoAulas
CREATE TABLE public.trilha_aulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trilha_id UUID NOT NULL REFERENCES public.trilhas(id) ON DELETE CASCADE,
    video_aula_id UUID NOT NULL REFERENCES public.video_aulas(id) ON DELETE CASCADE,
    ordem INT NOT NULL DEFAULT 0,
    UNIQUE(trilha_id, video_aula_id)
);

-- Tabela unificada para definições de Quizzes (para aulas e certificações)
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_aula_id UUID REFERENCES public.video_aulas(id) ON DELETE CASCADE,
    trilha_id UUID REFERENCES public.trilhas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL DEFAULT 'aula',
    titulo TEXT NOT NULL,
    qtd_perguntas_exibir INT NOT NULL DEFAULT 3,
    min_acertos INT NOT NULL DEFAULT 1
);

-- Tabela para as Perguntas e Respostas dos Quizzes
CREATE TABLE public.quiz_perguntas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    pergunta TEXT NOT NULL,
    tipo_pergunta TEXT NOT NULL DEFAULT 'multipla_escolha',
    opcoes JSONB,
    resposta_correta JSONB,
    imagem_url TEXT
);

-- Tabela para rastrear o progresso do usuário nas Trilhas
CREATE TABLE public.user_trilha_progresso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.cartorio_usuarios(id) ON DELETE CASCADE,
    trilha_id UUID NOT NULL REFERENCES public.trilhas(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress',
    data_inicio TIMESTAMPTZ DEFAULT now(),
    data_conclusao TIMESTAMPTZ,
    UNIQUE(user_id, trilha_id)
);

-- Tabela para rastrear o progresso e tentativas de Quizzes
CREATE TABLE public.user_quiz_tentativas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.cartorio_usuarios(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    trilha_id UUID REFERENCES public.trilhas(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL,
    aprovado BOOLEAN NOT NULL DEFAULT false,
    data_tentativa TIMESTAMPTZ DEFAULT now(),
    respostas_dadas JSONB
);

-- Modificação na tabela cartorio_usuarios para adicionar trilha ativa
ALTER TABLE public.cartorio_usuarios
ADD COLUMN active_trilha_id UUID REFERENCES public.trilhas(id) ON DELETE SET NULL;

-- Ativar RLS nas novas tabelas
ALTER TABLE public.trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trilha_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trilha_progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_tentativas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para trilhas (Admins gerenciam, usuários podem ver)
CREATE POLICY "Admins manage trilhas" ON public.trilhas
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users view trilhas" ON public.trilhas
FOR SELECT USING (true);

-- Políticas RLS para trilha_aulas
CREATE POLICY "Admins manage trilha_aulas" ON public.trilha_aulas
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users view trilha_aulas" ON public.trilha_aulas
FOR SELECT USING (true);

-- Políticas RLS para quizzes
CREATE POLICY "Admins manage quizzes" ON public.quizzes
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users view quizzes" ON public.quizzes
FOR SELECT USING (true);

-- Políticas RLS para quiz_perguntas
CREATE POLICY "Admins manage quiz_perguntas" ON public.quiz_perguntas
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users view quiz_perguntas" ON public.quiz_perguntas
FOR SELECT USING (true);

-- Políticas RLS para user_trilha_progresso
CREATE POLICY "Admins view all trilha progress" ON public.user_trilha_progresso
FOR SELECT USING (is_admin());

CREATE POLICY "Users manage own trilha progress" ON public.user_trilha_progresso
FOR ALL USING (user_id = get_current_cartorio_usuario_id())
WITH CHECK (user_id = get_current_cartorio_usuario_id());

-- Políticas RLS para user_quiz_tentativas
CREATE POLICY "Admins view all quiz attempts" ON public.user_quiz_tentativas
FOR SELECT USING (is_admin());

CREATE POLICY "Users manage own quiz attempts" ON public.user_quiz_tentativas
FOR ALL USING (user_id = get_current_cartorio_usuario_id())
WITH CHECK (user_id = get_current_cartorio_usuario_id());