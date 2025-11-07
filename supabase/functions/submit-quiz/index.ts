import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, quiz_id, trilha_id, respostas } = await req.json();

    // Buscar as perguntas e respostas corretas
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*, quiz_perguntas(*)')
      .eq('id', quiz_id)
      .single();

    if (quizError) throw quizError;

    // Calcular score
    let acertos = 0;
    const respostasComparacao = respostas.map((resposta: any) => {
      const pergunta = quiz.quiz_perguntas.find((p: any) => p.id === resposta.pergunta_id);
      if (!pergunta) return { ...resposta, correta: false };

      const respostaCorreta = JSON.stringify(pergunta.resposta_correta);
      const respostaUsuario = JSON.stringify(resposta.resposta);
      const correta = respostaCorreta === respostaUsuario;
      
      if (correta) acertos++;
      
      return { ...resposta, correta };
    });

    const score = (acertos / quiz.quiz_perguntas.length) * 100;
    const aprovado = acertos >= quiz.min_acertos;

    // Salvar tentativa
    const { data: tentativa, error: tentativaError } = await supabase
      .from('user_quiz_tentativas')
      .insert({
        user_id,
        quiz_id,
        trilha_id,
        score,
        aprovado,
        respostas_dadas: respostasComparacao
      })
      .select()
      .single();

    if (tentativaError) throw tentativaError;

    // Se foi aprovado e é um quiz de aula, verificar se a trilha foi completada
    if (aprovado && quiz.tipo === 'aula' && trilha_id) {
      await checkTrilhaCompletion(supabase, user_id, trilha_id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      aprovado,
      score,
      acertos,
      total: quiz.quiz_perguntas.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in submit-quiz:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

async function checkTrilhaCompletion(supabase: any, user_id: string, trilha_id: string) {
  // Buscar todas as aulas da trilha
  const { data: trilhaAulas } = await supabase
    .from('trilha_aulas')
    .select('video_aula_id')
    .eq('trilha_id', trilha_id);

  if (!trilhaAulas || trilhaAulas.length === 0) return;

  // Buscar todos os quizzes de aula da trilha
  const videoAulaIds = trilhaAulas.map((ta: any) => ta.video_aula_id);
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id')
    .in('video_aula_id', videoAulaIds)
    .eq('tipo', 'aula');

  if (!quizzes || quizzes.length === 0) return;

  // Verificar se todos foram aprovados
  const { data: tentativas } = await supabase
    .from('user_quiz_tentativas')
    .select('quiz_id, aprovado')
    .eq('user_id', user_id)
    .in('quiz_id', quizzes.map((q: any) => q.id))
    .eq('aprovado', true);

  // Se todos foram aprovados, marcar trilha como completada
  if (tentativas && tentativas.length === quizzes.length) {
    await supabase
      .from('user_trilha_progresso')
      .upsert({
        user_id,
        trilha_id,
        status: 'completed',
        data_conclusao: new Date().toISOString()
      }, {
        onConflict: 'user_id,trilha_id'
      });
  }
}