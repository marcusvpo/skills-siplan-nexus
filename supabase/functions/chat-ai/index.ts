import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  enforceRateLimit,
  getClientIp,
  getServiceSupabase,
  jsonResponse,
  requireCartorioOrAdmin,
} from "./security.ts";

const openAIApiKey = Deno.env.get("openai_api_key") ?? Deno.env.get("OPENAI_API_KEY");

type AssistantConfig = {
  name: string;
  promptId: string;
  promptVersion: string;
  vectorStoreId: string;
  allowedDomains: string[];
  country: string | null;
};

const ORION_PRO: AssistantConfig = {
  name: "Orion PRO",
  promptId: Deno.env.get("PROMPT_ID_ORION_PRO") ?? "pmpt_6a2c55e4969c8194ae9f66de2eefeca00e0cef6be4891706",
  promptVersion: Deno.env.get("PROMPT_VERSION_ORION_PRO") ?? "2",
  vectorStoreId: Deno.env.get("VECTOR_STORE_ID_ORION_PRO") ?? "vs_6a2c550854f88191af5edf3b43984b37",
  allowedDomains: [
    "cenprot.com.br",
    "cenprotsp.com.br",
    "ieptb.com.br",
    "protestobr.com.br",
    "cnj.jus.br",
    "planalto.gov.br",
    "siplan.com.br",
  ],
  country: null,
};

const ORION_TN: AssistantConfig = {
  name: "Orion TN",
  promptId: Deno.env.get("PROMPT_ID_ORION_TN") ?? "pmpt_6a2abdbe2da08197bfb29aaa958492800bdd6be9f0df3ecf",
  promptVersion: Deno.env.get("PROMPT_VERSION_ORION_TN") ?? "8",
  vectorStoreId: Deno.env.get("VECTOR_STORE_ID_ORION_TN") ?? "vs_6a2ab8c56ae881918fc9c2a8fb24748d",
  allowedDomains: [
    "e-notariado.org.br",
    "notariado.org.br",
    "cnj.jus.br",
    "anoreg.org.br",
    "cnbsp.org.br",
    "siplan.com.br",
  ],
  country: "BR",
};

function extractOutputText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }
  const parts: string[] = [];
  for (const item of data?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n\n").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  try {
    const supabase = getServiceSupabase();
    const actor = await requireCartorioOrAdmin(req, supabase);
    if (actor instanceof Response) return actor;

    const burstLimit = await enforceRateLimit(supabase, "chat_ai_burst", actor.subjectKey, 20, 600);
    if (burstLimit) return burstLimit;

    const hourlyKey = actor.cartorioId || `${actor.subjectKey}:${getClientIp(req)}`;
    const hourlyLimit = await enforceRateLimit(supabase, "chat_ai_hourly", hourlyKey, 60, 3600);
    if (hourlyLimit) return hourlyLimit;

    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const body = await req.json();
    const message: string = typeof body?.message === "string" ? body.message.trim() : "";
    const lessonTitle: string = typeof body?.lessonTitle === "string" ? body.lessonTitle : "";
    const previousResponseId: string | null =
      body?.previousResponseId ?? body?.responseId ?? body?.threadId ?? null;

    if (!message) {
      return jsonResponse({ error: "Mensagem obrigatória" }, 400);
    }

    if (message.length > 4000) {
      return jsonResponse(
        {
          error: "Mensagem excede o limite de 4.000 caracteres.",
          fallback_response: "Sua pergunta é muito longa. Por favor, resuma em até 4.000 caracteres.",
        },
        400,
      );
    }

    const assistant = lessonTitle.toLowerCase().includes("orion pro") ? ORION_PRO : ORION_TN;

    const payload: Record<string, unknown> = {
      prompt: { id: assistant.promptId, version: assistant.promptVersion },
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: message }],
        },
      ],
      tools: [
        {
          type: "file_search",
          vector_store_ids: [assistant.vectorStoreId],
        },
        {
          type: "web_search",
          filters: { allowed_domains: assistant.allowedDomains },
          search_context_size: "medium",
          user_location: {
            type: "approximate",
            country: assistant.country,
          },
        },
      ],
      store: true,
      metadata: {
        platform: "siplan-skills",
        lesson_title: (lessonTitle || "Unknown Lesson").slice(0, 500),
      },
    };

    if (previousResponseId && String(previousResponseId).startsWith("resp_")) {
      payload.previous_response_id = previousResponseId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 110_000);

    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if ((err as Error).name === "AbortError") {
        return jsonResponse({
          timeout: true,
          fallback_response:
            "O assistente está demorando mais que o esperado. Reformule sua pergunta de forma mais simples ou tente novamente.",
          threadId: previousResponseId,
          timestamp: new Date().toISOString(),
        });
      }
      throw err;
    }
    clearTimeout(timeoutId);

    const raw = await response.text();

    if (!response.ok) {
      console.error("[chat-ai] OpenAI error", response.status, raw.slice(0, 500));
      return jsonResponse(
        {
          error: `OpenAI Responses API retornou ${response.status}`,
          fallback_response:
            "Desculpe, o assistente está indisponível neste momento. Tente novamente em alguns instantes.",
          timestamp: new Date().toISOString(),
        },
        502,
      );
    }

    const data = JSON.parse(raw);
    const responseText = extractOutputText(data);

    if (!responseText) {
      throw new Error("No response from assistant");
    }

    return jsonResponse({
      response: responseText,
      responseId: data.id,
      threadId: data.id,
      assistant: assistant.name,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[chat-ai] Error:", error);
    return jsonResponse(
      {
        error: (error as Error).message || "Erro interno do servidor",
        fallback_response: "Desculpe, ocorreu um erro. Tente novamente em alguns instantes.",
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
});
