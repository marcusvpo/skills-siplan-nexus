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

export async function requireAdmin(
  req: Request,
  supabase: SupabaseClient,
): Promise<{ adminId: string; email: string } | Response> {
  const rawAuth = req.headers.get("authorization") || req.headers.get("x-custom-auth") || "";
  const token = rawAuth.replace(/^Bearer\s+/i, "").trim();

  if (!token || token.startsWith("sb_publishable_")) {
    return jsonResponse({ error: "Autenticação administrativa obrigatória", success: false }, 401);
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (!userError && userData?.user?.email) {
    const { data: adminRow } = await supabase
      .from("admins")
      .select("id, email")
      .ilike("email", userData.user.email.replace(/[\\%_]/g, "\\$&"))
      .maybeSingle();

    if (adminRow) return { adminId: adminRow.id, email: adminRow.email };
    return jsonResponse({ error: "Acesso negado: apenas administradores", success: false }, 403);
  }

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (jwtSecret) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret), {
        algorithms: ["HS256"],
      });
      if ((payload.role === "admin" || payload.is_admin === true) && typeof payload.email === "string") {
        const { data: adminRow } = await supabase
          .from("admins")
          .select("id, email")
          .ilike("email", payload.email.replace(/[\\%_]/g, "\\$&"))
          .maybeSingle();
        if (adminRow) return { adminId: adminRow.id, email: adminRow.email };
      }
    } catch {
      // Token inválido
    }
  }

  return jsonResponse({ error: "Token inválido ou não autorizado", success: false }, 401);
}
