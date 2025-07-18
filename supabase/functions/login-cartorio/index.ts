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

    console.log('🔑 [LOGIN] Gerando tokens de sessão para o usuário Supabase Auth:', authUser.id)

    // 4. Gerar sessão de autenticação do Supabase Auth usando generateLink
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

    console.log('🔍 [LOGIN] Link gerado:', linkData)

    // Extrair tokens do link gerado
    let access_token, refresh_token
    
    if (linkData?.properties?.access_token) {
      access_token = linkData.properties.access_token
      refresh_token = linkData.properties.refresh_token
      console.log('✅ [LOGIN] Tokens extraídos das propriedades do link')
    } else {
      // Fallback: tentar extrair da URL do action_link
      const actionLink = linkData?.properties?.action_link
      if (actionLink) {
        console.log('🔍 [LOGIN] Tentando extrair tokens da URL:', actionLink)
        try {
          const url = new URL(actionLink)
          access_token = url.searchParams.get('access_token')
          refresh_token = url.searchParams.get('refresh_token')
          
          if (access_token) {
            console.log('✅ [LOGIN] Tokens extraídos da URL do action_link')
          }
        } catch (urlError) {
          console.error('❌ [LOGIN] Erro ao parsear URL:', urlError)
        }
      }
    }

    if (!access_token) {
      console.error('❌ [LOGIN] Não foi possível extrair tokens do link gerado')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Falha na extração de tokens de autenticação',
          code: 'TOKEN_EXTRACTION_ERROR'
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
        access_token: access_token,
        refresh_token: refresh_token,
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