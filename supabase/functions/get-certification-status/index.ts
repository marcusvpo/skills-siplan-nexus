import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://deno.land/x/jose@v5.9.6/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JWT_SECRET = Deno.env.get('JWT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const CUSTOM_SERVICE_KEY = Deno.env.get('CUSTOM_SERVICE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== GET CERTIFICATION STATUS ===');
    
    // Obter token do header Authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [CERT] Token não fornecido ou formato inválido');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Validar JWT customizado usando jose
    if (!JWT_SECRET) {
      console.error('❌ [CERT] JWT_SECRET não configurado');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor inválida' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let payload: any;
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload: jwtPayload } = await jose.jwtVerify(token, secret, {
        algorithms: ['HS256'],
      });
      payload = jwtPayload;
      console.log('✅ [CERT] JWT válido - user_id:', payload.user_id);
    } catch (error) {
      console.error('❌ [CERT] Erro ao verificar JWT:', error);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = payload.user_id as string;
    
    // Criar cliente Supabase com Service Key
    const supabase = createClient(
      SUPABASE_URL,
      CUSTOM_SERVICE_KEY ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Obter parâmetros da URL
    const url = new URL(req.url);
    const urlUserId = url.searchParams.get('user_id');
    const trilha_id = url.searchParams.get('trilha_id');

    // Usar o user_id do JWT (mais seguro que confiar no parâmetro)
    const user_id = authenticatedUserId;

    if (!trilha_id) {
      console.error('❌ [CERT] trilha_id não fornecido');
      throw new Error('trilha_id é obrigatório');
    }

    console.log(`🔍 [CERT] Buscando status de certificação - user_id: ${user_id}, trilha_id: ${trilha_id}`);

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

    console.log('✅ [CERT] Status de certificação calculado com sucesso');
    
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
    console.error('❌ [CERT] Erro geral:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});