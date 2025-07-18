import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 [LOGIN] Iniciando função login-cartorio');
    
    const { email, password } = await req.json()
    console.log('📧 [LOGIN] Email recebido:', email);

    if (!email || !password) {
      console.log('❌ [LOGIN] Email ou senha não fornecidos');
      return new Response(JSON.stringify({
        success: false,
        message: 'Email e senha são obrigatórios'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Criar cliente Supabase para operações admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log('🔧 [LOGIN] Configurando cliente Supabase');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verificar se o usuário existe e validar senha
    console.log('🔍 [LOGIN] Tentando fazer login com signInWithPassword');
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.log('❌ [LOGIN] Erro de autenticação:', authError.message);
      return new Response(JSON.stringify({
        success: false,
        message: 'Credenciais inválidas'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    if (!authData.user) {
      console.log('❌ [LOGIN] Usuário não encontrado após autenticação');
      return new Response(JSON.stringify({
        success: false,
        message: 'Usuário não encontrado'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('✅ [LOGIN] Usuário autenticado com sucesso:', authData.user.id);

    // Buscar dados do cartório
    console.log('🏢 [LOGIN] Buscando dados do cartório');
    const { data: cartorioData, error: cartorioError } = await supabaseAdmin
      .from('cartorios')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    if (cartorioError) {
      console.log('❌ [LOGIN] Erro ao buscar cartório:', cartorioError.message);
      return new Response(JSON.stringify({
        success: false,
        message: 'Cartório não encontrado'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('🏢 [LOGIN] Cartório encontrado:', cartorioData.nome);

    // Retornar tokens de sessão existentes
    const responseData = {
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed_at: authData.user.email_confirmed_at,
        created_at: authData.user.created_at
      },
      cartorio: cartorioData,
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at,
        expires_in: authData.session?.expires_in,
        token_type: authData.session?.token_type
      }
    };

    console.log('🎉 [LOGIN] Login concluído com sucesso para:', email);
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.log('💥 [LOGIN] Erro geral na função login-cartorio:', error.message);
    return new Response(JSON.stringify({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});