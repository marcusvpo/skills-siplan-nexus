
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

    const { username, login_token } = requestData
    console.log('Login data received:', { username, login_token })

    if (!username || !login_token) {
      console.log('Missing username or login token')
      return new Response(
        JSON.stringify({ error: 'Nome de usuário e token de login são obrigatórios' }),
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

    // Primeiro, validar o token na tabela acessos_cartorio
    const { data: acesso, error: acessoError } = await supabase
      .from('acessos_cartorio')
      .select(`
        *,
        cartorios (
          id,
          nome,
          cidade,
          estado
        )
      `)
      .eq('login_token', login_token)
      .eq('ativo', true)
      .gt('data_expiracao', new Date().toISOString())
      .single()

    console.log('Token validation result:', { acesso, acessoError })

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

    console.log('Token validated, now validating username for cartorio:', acesso.cartorio_id)

    // Segundo, validar o username na tabela cartorio_usuarios
    const { data: usuario, error: usuarioError } = await supabase
      .from('cartorio_usuarios')
      .select('*')
      .eq('cartorio_id', acesso.cartorio_id)
      .eq('username', username)
      .eq('is_active', true)
      .single()

    console.log('Username validation result:', { usuario, usuarioError })

    if (usuarioError || !usuario) {
      console.log('Username not found or error:', usuarioError)
      return new Response(
        JSON.stringify({ error: 'Nome de usuário inválido para este cartório' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Username validated successfully for user:', usuario.id)

    // Gerar JWT customizado com cartorio_id e user_id
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
      user_id: usuario.id,
      username: usuario.username,
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
        usuario: {
          id: usuario.id,
          username: usuario.username,
          email: usuario.email
        },
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
