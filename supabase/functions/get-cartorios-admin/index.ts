
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🏢 [get-cartorios-admin] Admin cartorios list requested')

    // Buscar todos os cartórios com dados completos
    const { data: cartorios, error: cartoriosError } = await supabaseClient
      .from('cartorios')
      .select(`
        *,
        acessos_cartorio:acessos_cartorio(
          id,
          login_token,
          data_expiracao,
          ativo,
          email_contato
        ),
        cartorio_usuarios:cartorio_usuarios(
          id,
          username,
          email,
          is_active
        )
      `)
      .order('nome')

    if (cartoriosError) {
      console.error('❌ [get-cartorios-admin] Error fetching cartorios:', cartoriosError)
      throw cartoriosError
    }

    console.log(`✅ [get-cartorios-admin] Found ${cartorios?.length || 0} cartorios`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: cartorios || [],
        count: cartorios?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [get-cartorios-admin] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
