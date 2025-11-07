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

    const { id, nome, produto_id, aulas } = await req.json();

    // Atualizar a trilha
    const { data: trilha, error: trilhaError } = await supabase
      .from('trilhas')
      .update({ nome, produto_id })
      .eq('id', id)
      .select()
      .single();

    if (trilhaError) throw trilhaError;

    // Deletar aulas antigas
    await supabase
      .from('trilha_aulas')
      .delete()
      .eq('trilha_id', id);

    // Inserir novas aulas
    if (aulas && aulas.length > 0) {
      const trilhaAulas = aulas.map((aula: any, index: number) => ({
        trilha_id: id,
        video_aula_id: aula.video_aula_id,
        ordem: aula.ordem || index
      }));

      const { error: aulasError } = await supabase
        .from('trilha_aulas')
        .insert(trilhaAulas);

      if (aulasError) throw aulasError;
    }

    return new Response(JSON.stringify({ success: true, trilha }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in update-trilha:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});