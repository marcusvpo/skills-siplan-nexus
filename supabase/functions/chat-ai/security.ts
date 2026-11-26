import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify } from "https://deno.land/x/jose@v4.14.6/index.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-custom-auth",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function getServiceSupabase(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey =
    Deno.env.get("CUSTOM_SERVICE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export interface AuthenticatedActor {
  isAdmin: boolean;
  cartorioId: string | null;
  userId: string | null;
  subjectKey: string;
}

export async function requireCartorioOrAdmin(
  req: Request,
  supabase: SupabaseClient,
): Promise<AuthenticatedActor | Response> {
  const rawAuth = req.headers.get("x-custom-auth") || req.headers.get("authorization") || "";
  const token = rawAuth.replace(/^Bearer\s+/i, "").trim();

  if (!token || token.startsWith("sb_publishable_")) {
    return jsonResponse(
      { error: "Autenticação necessária para utilizar o assistente.", error_code: "UNAUTHORIZED" },
      401,
    );
  }

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (jwtSecret) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret), {
        algorithms: ["HS256"],
      });

      if (payload.role === "anon") {
        return jsonResponse(
          { error: "Sessão inválida. Faça login novamente.", error_code: "UNAUTHORIZED" },
          401,
        );
      }

      if (typeof payload.cartorio_id === "string" && payload.cartorio_id) {
        const { data: cartorio } = await supabase
          .from("cartorios")
          .select("id, is_active")
          .eq("id", payload.cartorio_id)
          .maybeSingle();

        if (!cartorio || cartorio.is_active === false) {
          return jsonResponse({ error: "Acesso do cartório inativo.", error_code: "FORBIDDEN" }, 403);
        }

        const userId = typeof payload.user_id === "string" ? payload.user_id : null;
        return {
          isAdmin: false,
          cartorioId: cartorio.id,
          userId,
          subjectKey: userId || cartorio.id,
        };
      }

      if ((payload.role === "admin" || payload.is_admin === true) && typeof payload.email === "string") {
        const { data: adminRow } = await supabase
          .from("admins")
          .select("id")
          .ilike("email", payload.email.replace(/[\\%_]/g, "\\$&"))
          .maybeSingle();
        if (adminRow) {
          return {
            isAdmin: true,
            cartorioId: null,
            userId: adminRow.id,
            subjectKey: `admin:${adminRow.id}`,
          };
        }
      }
    } catch {
      // Fallback admin Supabase Auth
    }
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (!userError && userData?.user?.email) {
    const { data: adminRow } = await supabase
      .from("admins")
      .select("id")
      .ilike("email", userData.user.email.replace(/[\\%_]/g, "\\$&"))
      .maybeSingle();
    if (adminRow) {
      return {
        isAdmin: true,
        cartorioId: null,
        userId: adminRow.id,
        subjectKey: `admin:${adminRow.id}`,
      };
    }
    return jsonResponse({ error: "Usuário sem permissão.", error_code: "FORBIDDEN" }, 403);
  }

  return jsonResponse(
    { error: "Sessão expirada ou inválida. Faça login novamente.", error_code: "UNAUTHORIZED" },
    401,
  );
}

export async function enforceRateLimit(
  supabase: SupabaseClient,
  bucket: string,
  subjectKey: string,
  maxHits: number,
  windowSeconds: number,
): Promise<Response | null> {
  const { data, error } = await supabase.rpc("check_skills_rate_limit", {
    p_bucket: bucket,
    p_subject_key: subjectKey,
    p_max_hits: maxHits,
    p_window_seconds: windowSeconds,
  });

  if (error) return null;

  if (data && data.allowed === false) {
    const retryAfter = Number(data.retry_after_seconds ?? 60);
    return new Response(
      JSON.stringify({
        error: "Limite de mensagens temporariamente atingido. Aguarde alguns minutos.",
        fallback_response:
          "Você enviou muitas perguntas em sequência. Aguarde alguns instantes antes de enviar uma nova dúvida.",
        retry_after_seconds: retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
        },
      },
    );
  }
  return null;
}
