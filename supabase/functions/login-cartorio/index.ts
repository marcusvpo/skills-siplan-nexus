// supabase/functions/login-cartorio/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 [LOGIN] Iniciando processo de autenticação...')
    
    const { username, login_token } = await req.json()
    console.log('🔍 [LOGIN] Tentativa de login para username:', username)

    // Criar cliente admin do Supabase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔍 [LOGIN] Token recebido (presença):', login_token ? 'sim' : 'não')

    // 1. Buscar usuário e validar token na tabela acessos_cartorio
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('cartorio_usuarios')
      .select(`
        id,
        cartorio_id,
        username,
        email,
        is_active,
        user_id,
        auth_user_id,
        cartorios!inner(
          id,
          nome,
          is_active
        )
      `)
      .eq('username', username)
      .eq('is_active', true)
      .eq('cartorios.is_active', true)
      .single()

    if (userError || !usuario) {
      console.log('❌ [LOGIN] Usuário não encontrado ou inativo:', usuario?.username || username)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Usuário não encontrado ou inativo',
          code: 'USER_NOT_FOUND'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('✅ [LOGIN] Usuário e cartório ativos encontrados:', usuario.username)

    // 2. Validar token de acesso na tabela acessos_cartorio
    const { data: acesso, error: accessError } = await supabaseAdmin
      .from('acessos_cartorio')
      .select('*')
      .eq('cartorio_id', usuario.cartorio_id)
      .eq('login_token', login_token)
      .eq('ativo', true)
      .gte('data_expiracao', new Date().toISOString())
      .single()

    if (accessError || !acesso) {
      console.log('❌ [LOGIN] Token inválido, expirado ou inativo')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token inválido, expirado ou inativo',
          code: 'INVALID_TOKEN'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('✅ [LOGIN] Token de acesso validado com sucesso na tabela acessos_cartorio.')

    // 3. Buscar/criar usuário no Supabase Auth
    const email = usuario.email || `${username}@cartorio.local`
    let authUser

    if (usuario.auth_user_id) {
      // Usuário já existe no Supabase Auth
      console.log('✅ [LOGIN] Usuário existente no Supabase Auth:', usuario.auth_user_id)
      authUser = { id: usuario.auth_user_id, email }
    } else {
      // Criar novo usuário no Supabase Auth
      console.log('🔄 [LOGIN] Criando novo usuário no Supabase Auth')
      
      const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: `temp_${Date.now()}`,
        email_confirm: true,
        user_metadata: {
          username: usuario.username,
          cartorio_id: usuario.cartorio_id,
          sistema_legado: true
        }
      })

      if (createError) {
        console.error('❌ [LOGIN] Erro ao criar usuário no Supabase Auth:', createError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Erro interno ao criar usuário',
            code: 'USER_CREATION_ERROR'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      authUser = newUserData.user
      console.log('✅ [LOGIN] Usuário criado no Supabase Auth:', authUser.id)

      // Atualizar cartorio_usuarios com o auth_user_id
      await supabaseAdmin
        .from('cartorio_usuarios')
        .update({ auth_user_id: authUser.id })
        .eq('id', usuario.id)
    }

    // 4. Gerar tokens de acesso do Supabase Auth
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://skills.siplan.com.br'}/dashboard`
      }
    })

    if (linkError) {
      console.error('❌ [LOGIN] Erro ao gerar link/tokens:', linkError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao gerar sessão de autenticação',
          code: 'SESSION_ERROR'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const { properties } = linkData
    if (!properties?.access_token || !properties?.refresh_token) {
      console.error('❌ [LOGIN] AccessToken ou RefreshToken não encontrados no link gerado.')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tokens de autenticação não gerados',
          code: 'TOKEN_ERROR'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('🎉 [LOGIN] Login completo com sucesso')

    // 5. Retornar resposta completa
    return new Response(
      JSON.stringify({
        success: true,
        cartorio: {
          id: usuario.cartorio_id,
          nome: usuario.cartorios.nome,
          cidade: 'Jaboticabal', // Hardcoded por enquanto
          estado: 'SP'
        },
        usuario: {
          id: authUser.id,
          username: usuario.username,
          email: email,
          cartorio_user_id: usuario.id
        },
        access_token: properties.access_token,
        refresh_token: properties.refresh_token,
        message: `Bem-vindo(a), ${usuario.username}! Acesso autorizado para ${usuario.cartorios.nome}.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 [LOGIN] Erro interno:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})