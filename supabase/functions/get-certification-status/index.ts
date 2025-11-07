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
    const user_id = url.searchParams.get('user_id');
    const trilha_id = url.searchParams.get('trilha_id');

    if (!user_id || !trilha_id) {
      throw new Error('user_id e trilha_id são obrigatórios');
    }

    // Verificar se a trilha foi completada
    const { data: progresso } = await supabase
      .from('user_trilha_progresso')
      .select('status')
      .eq('user_id', user_id)
      .eq('trilha_id', trilha_id)
      .single();

    const trilhaCompleta = progresso?.status === 'completed';

    // Buscar quizzes de certificação
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id, tipo')
      .eq('trilha_id', trilha_id)
      .in('tipo', ['bronze', 'prata']);

    // Verificar aprovações
    const { data: tentativas } = await supabase
      .from('user_quiz_tentativas')
      .select('quiz_id, aprovado')
      .eq('user_id', user_id)
      .eq('trilha_id', trilha_id)
      .eq('aprovado', true);

    const quizAprovados = new Set(tentativas?.map(t => t.quiz_id) || []);
    
    const bronzeQuiz = quizzes?.find(q => q.tipo === 'bronze');
    const prataQuiz = quizzes?.find(q => q.tipo === 'prata');

    const bronze_unlocked = trilhaCompleta;
    const bronze_aprovado = bronzeQuiz ? quizAprovados.has(bronzeQuiz.id) : false;
    
    const prata_unlocked = bronze_aprovado;
    const prata_aprovado = prataQuiz ? quizAprovados.has(prataQuiz.id) : false;
    
    const ouro_unlocked = prata_aprovado;

    return new Response(JSON.stringify({ 
      trilhaCompleta,
      bronze_unlocked,
      bronze_aprovado,
      bronze_quiz_id: bronzeQuiz?.id,
      prata_unlocked,
      prata_aprovado,
      prata_quiz_id: prataQuiz?.id,
      ouro_unlocked
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in get-certification-status:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});