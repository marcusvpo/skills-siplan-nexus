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

    const url = new URL(req.url);
    const quiz_id = url.searchParams.get('quiz_id');

    if (!quiz_id) {
      throw new Error('quiz_id é obrigatório');
    }

    // Buscar o quiz com suas perguntas
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*, quiz_perguntas(*)')
      .eq('id', quiz_id)
      .single();

    if (quizError) throw quizError;

    // Randomizar e limitar perguntas
    let perguntas = quiz.quiz_perguntas || [];
    
    // Embaralhar perguntas
    perguntas = perguntas.sort(() => Math.random() - 0.5);
    
    // Limitar ao número configurado
    if (quiz.qtd_perguntas_exibir && perguntas.length > quiz.qtd_perguntas_exibir) {
      perguntas = perguntas.slice(0, quiz.qtd_perguntas_exibir);
    }

    // Remover resposta_correta das perguntas enviadas ao frontend
    const perguntasSemResposta = perguntas.map((p: any) => {
      const { resposta_correta, ...perguntaSemResposta } = p;
      return perguntaSemResposta;
    });

    return new Response(JSON.stringify({ 
      quiz: {
        id: quiz.id,
        titulo: quiz.titulo,
        tipo: quiz.tipo,
        min_acertos: quiz.min_acertos
      },
      perguntas: perguntasSemResposta
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in get-quiz-perguntas:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});