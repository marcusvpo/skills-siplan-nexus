
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'
import { sign } from "https://deno.land/x/djwt@v3.0.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { login_token } = await req.json()

    if (!login_token) {
      return new Response(
        JSON.stringify({ error: 'Token de login é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Validating token:', login_token)

    // Buscar o token na tabela acessos_cartorio
    const { data: acesso, error: acessoError } = await supabase
      .from('acessos_cartorio')
      .select(`
        *,
        cartorios (
          id,
          nome,
          cnpj
        )
      `)
      .eq('login_token', login_token)
      .eq('ativo', true)
      .gt('data_expiracao', new Date().toISOString())
      .single()

    if (acessoError || !acesso) {
      console.log('Token not found or error:', acessoError)
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Token validated successfully for cartorio:', acesso.cartorio_id)

    // Gerar JWT customizado
    const jwtSecret = Deno.env.get('JWT_SECRET')
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured')
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor inválida' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const payload = {
      cartorio_id: acesso.cartorio_id,
      login_token: login_token,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
      iat: Math.floor(Date.now() / 1000)
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    )

    const jwt = await sign(payload, key, "HS256")

    console.log('JWT generated successfully')

    // Retornar resposta de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        token: jwt,
        cartorio: acesso.cartorios,
        message: 'Login realizado com sucesso'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in login-cartorio:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
