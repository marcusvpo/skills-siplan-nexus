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

export async function requireCartorioOrAdmin(
  req: Request,
  supabase: SupabaseClient,
): Promise<{ isAdmin: boolean; cartorioId: string | null } | Response> {
  const rawAuth = req.headers.get("x-custom-auth") || req.headers.get("authorization") || "";
  const token = rawAuth.replace(/^Bearer\s+/i, "").trim();

  if (!token || token.startsWith("sb_publishable_")) {
    return jsonResponse({ success: false, error: "Autenticação obrigatória" }, 401);
  }

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (jwtSecret) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret), {
        algorithms: ["HS256"],
      });

      if (payload.role === "anon") {
        return jsonResponse({ success: false, error: "Não autorizado" }, 401);
      }

      if (typeof payload.cartorio_id === "string" && payload.cartorio_id) {
        const { data: cartorio } = await supabase
          .from("cartorios")
          .select("id, is_active")
          .eq("id", payload.cartorio_id)
          .maybeSingle();

        if (!cartorio || cartorio.is_active === false) {
          return jsonResponse({ success: false, error: "Cartório inativo" }, 403);
        }

        return { isAdmin: false, cartorioId: cartorio.id };
      }

      if ((payload.role === "admin" || payload.is_admin === true) && typeof payload.email === "string") {
        const { data: adminRow } = await supabase
          .from("admins")
          .select("id")
          .ilike("email", payload.email.replace(/[\\%_]/g, "\\$&"))
          .maybeSingle();
        if (adminRow) return { isAdmin: true, cartorioId: null };
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
    if (adminRow) return { isAdmin: true, cartorioId: null };
    return jsonResponse({ success: false, error: "Acesso negado" }, 403);
  }

  return jsonResponse({ success: false, error: "Token inválido" }, 401);
}
