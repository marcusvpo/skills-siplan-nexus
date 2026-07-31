import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('openai_api_key') ?? Deno.env.get('OPENAI_API_KEY');

/**
 * Migração Assistants API -> Responses API.
 * Assistants -> Prompts (versionados no dashboard)
 * Threads    -> encadeamento via previous_response_id
 * Runs       -> Responses
 */
type AssistantConfig = {
  name: string;
  promptId: string;
  promptVersion: string;
  vectorStoreId: string;
  allowedDomains: string[];
  country: string | null;
};

const ORION_PRO: AssistantConfig = {
  name: 'Orion PRO',
  promptId: Deno.env.get('PROMPT_ID_ORION_PRO') ?? 'pmpt_6a2c55e4969c8194ae9f66de2eefeca00e0cef6be4891706',
  promptVersion: Deno.env.get('PROMPT_VERSION_ORION_PRO') ?? '2',
  vectorStoreId: Deno.env.get('VECTOR_STORE_ID_ORION_PRO') ?? 'vs_6a2c550854f88191af5edf3b43984b37',
  allowedDomains: [
    'cenprot.com.br',
    'cenprotsp.com.br',
    'ieptb.com.br',
    'protestobr.com.br',
    'cnj.jus.br',
    'planalto.gov.br',
    'siplan.com.br',
  ],
  country: null,
};

const ORION_TN: AssistantConfig = {
  name: 'Orion TN',
  promptId: Deno.env.get('PROMPT_ID_ORION_TN') ?? 'pmpt_6a2abdbe2da08197bfb29aaa958492800bdd6be9f0df3ecf',
  promptVersion: Deno.env.get('PROMPT_VERSION_ORION_TN') ?? '8',
  vectorStoreId: Deno.env.get('VECTOR_STORE_ID_ORION_TN') ?? 'vs_6a2ab8c56ae881918fc9c2a8fb24748d',
  allowedDomains: [
    'e-notariado.org.br',
    'notariado.org.br',
    'cnj.jus.br',
    'anoreg.org.br',
    'cnbsp.org.br',
    'siplan.com.br',
  ],
  country: 'BR',
};

function extractOutputText(data: any): string {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text;
  }
  const parts: string[] = [];
  for (const item of data?.output ?? []) {
    if (item?.type !== 'message') continue;
    for (const content of item?.content ?? []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') {
        parts.push(content.text);
      }
    }
  }
  return parts.join('\n\n').trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const body = await req.json();
    const message: string = body?.message;
    const lessonTitle: string = body?.lessonTitle ?? '';
    // `threadId` mantido por compatibilidade com o cliente: agora é o id da última response.
    const previousResponseId: string | null =
      body?.previousResponseId ?? body?.responseId ?? body?.threadId ?? null;

    if (!message || !message.trim()) {
      throw new Error('Message is required');
    }

    const assistant = lessonTitle.toLowerCase().includes('orion pro') ? ORION_PRO : ORION_TN;

    console.log('🤖 [chat-ai] Responses API', {
      assistant: assistant.name,
      promptId: assistant.promptId,
      promptVersion: assistant.promptVersion,
      hasPrevious: !!previousResponseId,
      lessonTitle,
    });

    const payload: Record<string, unknown> = {
      prompt: { id: assistant.promptId, version: assistant.promptVersion },
      input: [
        {
          role: 'user',
          content: [{ type: 'input_text', text: message }],
        },
      ],
      tools: [
        {
          type: 'file_search',
          vector_store_ids: [assistant.vectorStoreId],
        },
        {
          type: 'web_search',
          filters: { allowed_domains: assistant.allowedDomains },
          search_context_size: 'medium',
          user_location: {
            type: 'approximate',
            country: assistant.country,
          },
        },
      ],
      store: true,
      metadata: {
        platform: 'siplan-skills',
        lesson_title: (lessonTitle || 'Unknown Lesson').slice(0, 500),
      },
    };

    if (previousResponseId && String(previousResponseId).startsWith('resp_')) {
      payload.previous_response_id = previousResponseId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 110_000);

    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if ((err as Error).name === 'AbortError') {
        return new Response(JSON.stringify({
          timeout: true,
          fallback_response: 'O assistente está demorando mais que o esperado. Reformule sua pergunta de forma mais simples ou tente novamente.',
          threadId: previousResponseId,
          timestamp: new Date().toISOString(),
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw err;
    }
    clearTimeout(timeoutId);

    const raw = await response.text();

    if (!response.ok) {
      console.error('❌ [chat-ai] OpenAI error', response.status, raw.slice(0, 1000));
      return new Response(JSON.stringify({
        error: `OpenAI Responses API retornou ${response.status}`,
        fallback_response: 'Desculpe, o assistente está indisponível neste momento. Tente novamente em alguns instantes.',
        timestamp: new Date().toISOString(),
      }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = JSON.parse(raw);

    if (data.status === 'incomplete') {
      console.warn('⚠️ [chat-ai] Response incomplete', data.incomplete_details);
    }

    const responseText = extractOutputText(data);

    if (!responseText) {
      console.error('❌ [chat-ai] Empty output', JSON.stringify(data).slice(0, 1000));
      throw new Error('No response from assistant');
    }

    console.log('✅ [chat-ai] Response ok', { id: data.id, length: responseText.length });

    return new Response(JSON.stringify({
      response: responseText,
      responseId: data.id,
      // compat: o cliente antigo guarda isso como "threadId"
      threadId: data.id,
      assistant: assistant.name,
      timestamp: new Date().toISOString(),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('❌ [chat-ai] Error:', error);
    return new Response(JSON.stringify({
      error: (error as Error).message || 'Erro interno do servidor',
      fallback_response: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.',
      timestamp: new Date().toISOString(),
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
