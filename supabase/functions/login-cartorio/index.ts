
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { username, login_token } = await req.json()

    if (!username || !login_token) {
      return new Response(
        JSON.stringify({ error: 'Username e login_token são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Validating login for username:', username, 'with token:', login_token)

    // Validate token and get cartorio
    const { data: acessoData, error: acessoError } = await supabaseAdmin
      .from('acessos_cartorio')
      .select(`
        *,
        cartorios!inner(
          id,
          nome,
          cidade,
          estado,
          is_active
        )
      `)
      .eq('login_token', login_token)
      .eq('ativo', true)
      .gt('data_expiracao', new Date().toISOString())
      .single()

    if (acessoError || !acessoData) {
      console.log('Token validation failed:', acessoError)
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if cartorio is active
    if (!acessoData.cartorios.is_active) {
      console.log('Cartorio is inactive:', acessoData.cartorios.id)
      return new Response(
        JSON.stringify({ error: 'Cartório inativo' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate user exists and is active
    const { data: userData, error: userError } = await supabaseAdmin
      .from('cartorio_usuarios')
      .select('*')
      .eq('cartorio_id', acessoData.cartorios.id)
      .eq('username', username)
      .eq('is_active', true)
      .single()

    if (userError || !userData) {
      console.log('User validation failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado ou inativo' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Login successful for user:', userData.id, 'cartorio:', acessoData.cartorios.id)

    // Create JWT with user information
    const secret = new TextEncoder().encode(Deno.env.get('JWT_SECRET'))
    
    const jwt = await new jose.SignJWT({
      cartorio_id: acessoData.cartorios.id,
      user_id: userData.id,
      username: userData.username,
      email: userData.email,
      role: 'cartorio_user'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          cartorio_id: acessoData.cartorios.id,
          cartorio_name: acessoData.cartorios.nome
        },
        token: jwt
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
