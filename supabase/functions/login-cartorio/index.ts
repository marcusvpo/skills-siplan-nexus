
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Login cartorio function called with method:', req.method)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.text()
    console.log('Request body received:', body)
    
    let requestData
    try {
      requestData = JSON.parse(body)
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { login_token } = requestData
    console.log('Login token received:', login_token)

    if (!login_token) {
      console.log('No login token provided')
      return new Response(
        JSON.stringify({ error: 'Token de login é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Service key available:', !!supabaseServiceKey)
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor inválida' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

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

    console.log('Query result:', { acesso, acessoError })

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

    // Gerar JWT customizado - versão simplificada
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

    // Criar payload do JWT
    const header = {
      alg: "HS256",
      typ: "JWT"
    }

    const payload = {
      cartorio_id: acesso.cartorio_id,
      login_token: login_token,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
      iat: Math.floor(Date.now() / 1000)
    }

    // Codificar em base64 URL-safe
    const encoder = new TextEncoder()
    const headerEncoded = btoa(JSON.stringify(header))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    
    const payloadEncoded = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    // Criar assinatura HMAC
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(headerEncoded + "." + payloadEncoded)
    )

    const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    const jwt = `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`

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
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
