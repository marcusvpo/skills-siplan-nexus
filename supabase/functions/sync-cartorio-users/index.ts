import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CartorioUser {
  id: string;
  email: string;
  username: string;
}

interface SyncRequest {
  dummyPassword: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    totalFound: number;
    created: number;
    alreadyExists: number;
    errors: number;
    skippedNoEmail: number;
  };
  details: Array<{
    username: string;
    email: string;
    status: 'created' | 'exists' | 'error' | 'skipped';
    message?: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const { dummyPassword }: SyncRequest = await req.json();

    if (!dummyPassword) {
      return new Response(
        JSON.stringify({ error: "dummyPassword é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("🔐 [sync-cartorio-users] Iniciando sincronização com senha fornecida");

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log("✅ [sync-cartorio-users] Cliente Supabase Admin inicializado");

    // Step 1: Get all cartorio users with email
    const { data: cartorioUsers, error: fetchError } = await supabaseAdmin
      .from('cartorio_usuarios')
      .select('id, email, username')
      .not('email', 'is', null)
      .neq('email', '');

    if (fetchError) {
      console.error("❌ [sync-cartorio-users] Erro ao buscar usuários de cartório:", fetchError);
      throw new Error(`Erro ao buscar usuários: ${fetchError.message}`);
    }

    const totalFound = cartorioUsers?.length || 0;
    console.log(`📊 [sync-cartorio-users] Encontrados ${totalFound} usuários com email válido`);

    const result: SyncResult = {
      success: true,
      message: "Sincronização concluída",
      stats: {
        totalFound,
        created: 0,
        alreadyExists: 0,
        errors: 0,
        skippedNoEmail: 0
      },
      details: []
    };

    if (!cartorioUsers || cartorioUsers.length === 0) {
      result.message = "Nenhum usuário encontrado com email válido";
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Step 2: Process each user
    for (const usuario of cartorioUsers as CartorioUser[]) {
      console.log(`🔄 [sync-cartorio-users] Processando usuário: ${usuario.username} (${usuario.email})`);

      try {
        // Try to create user in Supabase Auth
        const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: usuario.email,
          password: dummyPassword,
          email_confirm: true,
          user_metadata: {
            cartorio_user_id: usuario.id,
            cartorio_username: usuario.username,
            source: 'siplan-cartorio-sync',
            sync_date: new Date().toISOString()
          }
        });

        if (createError) {
          // Check if user already exists
          if (createError.message.toLowerCase().includes('user already exists') || 
              createError.message.toLowerCase().includes('already registered')) {
            console.log(`ℹ️ [sync-cartorio-users] Usuário já existe: ${usuario.email}`);
            result.stats.alreadyExists++;
            result.details.push({
              username: usuario.username,
              email: usuario.email,
              status: 'exists',
              message: 'Usuário já existe no Supabase Auth'
            });
          } else {
            console.error(`❌ [sync-cartorio-users] Erro ao criar usuário ${usuario.email}:`, createError);
            result.stats.errors++;
            result.details.push({
              username: usuario.username,
              email: usuario.email,
              status: 'error',
              message: createError.message
            });
          }
        } else {
          console.log(`✅ [sync-cartorio-users] Usuário criado com sucesso: ${usuario.email} (ID: ${createdUser?.user?.id})`);
          result.stats.created++;
          result.details.push({
            username: usuario.username,
            email: usuario.email,
            status: 'created',
            message: `Criado com ID: ${createdUser?.user?.id}`
          });
        }
      } catch (error) {
        console.error(`❌ [sync-cartorio-users] Erro inesperado ao processar ${usuario.email}:`, error);
        result.stats.errors++;
        result.details.push({
          username: usuario.username,
          email: usuario.email,
          status: 'error',
          message: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
      }
    }

    // Generate summary
    console.log("📋 [sync-cartorio-users] Resumo da sincronização:");
    console.log(`   Total encontrados: ${result.stats.totalFound}`);
    console.log(`   Criados: ${result.stats.created}`);
    console.log(`   Já existiam: ${result.stats.alreadyExists}`);
    console.log(`   Erros: ${result.stats.errors}`);

    result.message = `Sincronização concluída: ${result.stats.created} criados, ${result.stats.alreadyExists} já existiam, ${result.stats.errors} erros`;

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("❌ [sync-cartorio-users] Erro geral:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
        stats: {
          totalFound: 0,
          created: 0,
          alreadyExists: 0,
          errors: 1,
          skippedNoEmail: 0
        }
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
