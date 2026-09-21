// Entrega a URL do webinar apenas se a janela de disponibilidade estiver aberta
// e o cartório tiver permissão no produto. A decisão é 100% server-side.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify } from "https://deno.land/x/jose@v4.14.6/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-auth',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey =
  Deno.env.get('CUSTOM_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const jwtSecret = Deno.env.get('JWT_SECRET');

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DAY = 24 * 60 * 60 * 1000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const videoAulaId = typeof body?.video_aula_id === 'string' ? body.video_aula_id.trim() : '';

    if (!videoAulaId) {
      return json({ error: 'video_aula_id é obrigatório', error_code: 'BAD_REQUEST' }, 400);
    }

    // 1. Identificar o cartório a partir do token customizado
    const authHeader = req.headers.get('x-custom-auth') || req.headers.get('authorization');
    if (!authHeader) {
      return json({ error: 'Token de autenticação necessário', error_code: 'UNAUTHORIZED' }, 401);
    }

    let cartorioId: string | null = null;

    if (authHeader.startsWith('CART-')) {
      try {
        const decoded = JSON.parse(atob(authHeader.replace('CART-', '')));
        cartorioId = decoded.cartorio_id ?? null;
      } catch {
        return json({ error: 'Token inválido', error_code: 'UNAUTHORIZED' }, 401);
      }
    } else {
      if (!jwtSecret) {
        return json({ error: 'Configuração de autenticação inválida' }, 500);
      }
      try {
        const token = authHeader.replace('Bearer ', '');
        const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
        cartorioId = (payload.cartorio_id as string) ?? null;
      } catch (e) {
        const expired = (e as any)?.code === 'ERR_JWT_EXPIRED' || (e as any)?.name === 'JWTExpired';
        return json(
          {
            error: expired ? 'Sessão expirada. Faça login novamente.' : 'Token inválido',
            error_code: expired ? 'JWT_EXPIRED' : 'UNAUTHORIZED',
          },
          401
        );
      }
    }

    if (!cartorioId) {
      return json({ error: 'Cartório não identificado', error_code: 'UNAUTHORIZED' }, 401);
    }

    // 2. Buscar o webinar
    const { data: video, error: videoError } = await supabase
      .from('video_aulas')
      .select(`
        id, titulo, descricao, url_video, url_thumbnail, id_video_bunny, ordem,
        disponivel_em, dias_disponibilidade, disponivel_ate, webinar_ativo,
        produtos ( id, nome, tipo, sistema_id, sistemas ( id, nome ) )
      `)
      .eq('id', videoAulaId)
      .maybeSingle();

    if (videoError) {
      console.error('❌ [get-webinar-video] Erro ao buscar videoaula', videoError);
      return json({ error: 'Erro ao carregar o webinar' }, 500);
    }

    if (!video) {
      return json({ error: 'Webinar não encontrado', error_code: 'NOT_FOUND' }, 404);
    }

    const produto: any = (video as any).produtos;

    // 3. Permissão de conteúdo do cartório
    const { data: permissions, error: permError } = await supabase
      .from('cartorio_acesso_conteudo')
      .select('sistema_id, produto_id')
      .eq('cartorio_id', cartorioId)
      .eq('ativo', true);

    if (permError) {
      console.error('❌ [get-webinar-video] Erro ao verificar permissões', permError);
      return json({ error: 'Erro ao verificar permissões' }, 500);
    }

    if (permissions && permissions.length > 0) {
      const allowed = permissions.some(
        (p) =>
          p.produto_id === produto?.id ||
          (!p.produto_id && p.sistema_id && p.sistema_id === produto?.sistema_id)
      );
      if (!allowed) {
        return json(
          { error: 'Este conteúdo não está liberado para o seu acesso', error_code: 'NO_PERMISSION' },
          403
        );
      }
    }

    // 4. Janela de disponibilidade (hora do servidor)
    const now = Date.now();
    const startsAt = video.disponivel_em ? new Date(video.disponivel_em).getTime() : null;
    let endsAt: number | null = video.disponivel_ate
      ? new Date(video.disponivel_ate).getTime()
      : null;
    if (endsAt === null && startsAt !== null && video.dias_disponibilidade) {
      endsAt = startsAt + video.dias_disponibilidade * DAY;
    }

    const windowMeta = {
      disponivel_em: video.disponivel_em,
      disponivel_ate: endsAt ? new Date(endsAt).toISOString() : null,
      server_time: new Date(now).toISOString(),
    };

    if (video.webinar_ativo === false) {
      return json(
        { error: 'Este webinar está indisponível no momento', error_code: 'WEBINAR_INACTIVE', ...windowMeta },
        403
      );
    }

    if (startsAt !== null && startsAt > now) {
      return json(
        { error: 'Este webinar ainda não foi liberado', error_code: 'WEBINAR_NOT_STARTED', ...windowMeta },
        403
      );
    }

    if (endsAt !== null && endsAt <= now) {
      return json(
        {
          error: 'O período de visualização deste webinar foi encerrado',
          error_code: 'WEBINAR_EXPIRED',
          ...windowMeta,
        },
        403
      );
    }

    // 5. Liberado
    return json({
      success: true,
      video: {
        id: video.id,
        titulo: video.titulo,
        descricao: video.descricao,
        url_video: video.url_video,
        url_thumbnail: video.url_thumbnail,
        id_video_bunny: video.id_video_bunny,
        ordem: video.ordem,
      },
      produto: produto ? { id: produto.id, nome: produto.nome, tipo: produto.tipo } : null,
      sistema: produto?.sistemas ? { id: produto.sistemas.id, nome: produto.sistemas.nome } : null,
      ...windowMeta,
    });
  } catch (error) {
    console.error('❌ [get-webinar-video] Erro inesperado', error);
    return json({ error: (error as Error)?.message || 'Erro interno do servidor' }, 500);
  }
});
