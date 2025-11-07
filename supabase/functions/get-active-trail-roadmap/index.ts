import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import * as jose from "https://deno.land/x/jose@v5.9.6/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JWT_SECRET = Deno.env.get('JWT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const CUSTOM_SERVICE_KEY = Deno.env.get('CUSTOM_SERVICE_KEY');

console.log('🔧 [Edge Function Init] JWT Secret:', JWT_SECRET ? 'Present' : 'Missing');
console.log('🔧 [Edge Function Init] Using service key:', CUSTOM_SERVICE_KEY ? 'Present' : 'Missing');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== GET ACTIVE TRAIL ROADMAP ===');
    
    // Obter token do header Authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [ROADMAP] Token não fornecido ou formato inválido');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Validar JWT customizado usando jose
    if (!JWT_SECRET) {
      console.error('❌ [ROADMAP] JWT_SECRET não configurado');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor inválida' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 [JWT] Verificando JWT token...');
    let payload: any;
    
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload: jwtPayload } = await jose.jwtVerify(token, secret, {
        algorithms: ['HS256'],
      });
      payload = jwtPayload;
      console.log('🔍 [JWT] Full payload:', JSON.stringify(payload, null, 2));
    } catch (error) {
      console.error('❌ [JWT] Erro ao verificar JWT:', error);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = payload.user_id as string;
    const cartorioId = payload.cartorio_id as string;

    if (!userId) {
      console.error('❌ [ROADMAP] user_id não encontrado no JWT');
      return new Response(
        JSON.stringify({ error: 'Usuário não identificado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ [ROADMAP] JWT válido - user_id: ${userId}, cartorio_id: ${cartorioId}`);

    // Criar cliente Supabase com Service Key (SEM passar o JWT do usuário)
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

    // Buscar active_trilha_id do usuário
    const { data: usuario, error: usuarioError } = await supabase
      .from('cartorio_usuarios')
      .select('active_trilha_id')
      .eq('id', userId)
      .single();

    if (usuarioError || !usuario) {
      console.error('[get-active-trail-roadmap] Erro ao buscar usuário:', usuarioError);
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!usuario.active_trilha_id) {
      console.log('[get-active-trail-roadmap] Usuário sem trilha ativa');
      return new Response(
        JSON.stringify({ error: 'Usuário não possui trilha ativa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trilhaId = usuario.active_trilha_id;
    console.log('[get-active-trail-roadmap] Trilha ID:', trilhaId);

    // Buscar dados completos da trilha
    const { data: trilha, error: trilhaError } = await supabase
      .from('trilhas')
      .select(`
        id,
        nome,
        produtos (
          id,
          nome,
          sistemas (
            id,
            nome
          )
        )
      `)
      .eq('id', trilhaId)
      .single();

    if (trilhaError || !trilha) {
      console.error('[get-active-trail-roadmap] Erro ao buscar trilha:', trilhaError);
      return new Response(
        JSON.stringify({ error: 'Trilha não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar aulas da trilha com seus detalhes
    const { data: trilhaAulas, error: aulasError } = await supabase
      .from('trilha_aulas')
      .select(`
        ordem,
        video_aula_id,
        video_aulas (
          id,
          titulo,
          descricao,
          url_video,
          url_thumbnail
        )
      `)
      .eq('trilha_id', trilhaId)
      .order('ordem', { ascending: true });

    if (aulasError) {
      console.error('[get-active-trail-roadmap] Erro ao buscar aulas da trilha:', aulasError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar aulas da trilha' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar progresso do usuário (quizzes aprovados)
    const aulaIds = trilhaAulas?.map(ta => ta.video_aula_id) || [];
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id, video_aula_id')
      .in('video_aula_id', aulaIds)
      .eq('tipo', 'aula');

    const { data: tentativas } = await supabase
      .from('user_quiz_tentativas')
      .select('quiz_id, aprovado')
      .eq('user_id', userId)
      .eq('aprovado', true);

    // Criar mapa de quizzes aprovados
    const quizAprovados = new Set(tentativas?.map(t => t.quiz_id) || []);
    const quizMap = new Map(quizzes?.map(q => [q.video_aula_id, q.id]) || []);

    // Processar aulas com status
    const aulas = trilhaAulas?.map((ta, index) => {
      const aula = ta.video_aulas;
      const quizId = quizMap.get(ta.video_aula_id);
      const aulaCompleta = quizId && quizAprovados.has(quizId);
      
      // Determinar status
      let status: 'concluido' | 'pendente' | 'bloqueado';
      
      if (aulaCompleta) {
        status = 'concluido';
      } else if (index === 0) {
        // Primeira aula sempre liberada
        status = 'pendente';
      } else {
        // Verificar se a aula anterior foi concluída
        const aulaAnteriorId = trilhaAulas[index - 1].video_aula_id;
        const quizAnteriorId = quizMap.get(aulaAnteriorId);
        const aulaAnteriorCompleta = quizAnteriorId && quizAprovados.has(quizAnteriorId);
        
        status = aulaAnteriorCompleta ? 'pendente' : 'bloqueado';
      }

      return {
        id: aula.id,
        titulo: aula.titulo,
        descricao: aula.descricao,
        url_video: aula.url_video,
        url_thumbnail: aula.url_thumbnail,
        ordem: ta.ordem,
        status,
      };
    }) || [];

    // Montar resposta estruturada
    const response = {
      trilha: {
        id: trilha.id,
        nome: trilha.nome,
      },
      produto: {
        id: trilha.produtos?.id,
        nome: trilha.produtos?.nome,
      },
      sistema: {
        id: trilha.produtos?.sistemas?.id,
        nome: trilha.produtos?.sistemas?.nome,
      },
      aulas,
    };

    console.log('[get-active-trail-roadmap] Resposta:', JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[get-active-trail-roadmap] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
