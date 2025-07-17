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
    const { username, token } = await req.json()
    
    console.log('🔍 [LOGIN] Iniciando login para username:', username)

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

    // 1. Validar credenciais no sistema legado
    const legacyResponse = await fetch('https://ws.siplan.com.br/cartorio/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, token })
    })

    if (!legacyResponse.ok) {
      console.log('❌ [LOGIN] Falha na autenticação do sistema legado')
      return new Response(
        JSON.stringify({ success: false, error: 'Credenciais inválidas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const userData = await legacyResponse.json()
    console.log('✅ [LOGIN] Autenticação legada bem-sucedida para:', userData.username)

    // 2. Buscar ou criar usuário no Supabase Auth
    const email = `${username}@cartorio.local`
    
    // Tentar buscar usuário existente usando a API correta
    const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers({
      filter: `email.eq.${email}`
    })

    console.log('🔍 [LOGIN] Busca de usuário existente:', { existingUsers, searchError })

    let authUser
    let session

    if (existingUsers && existingUsers.users && existingUsers.users.length > 0) {
      // Usuário existe, gerar nova sessão
      authUser = existingUsers.users[0]
      console.log('✅ [LOGIN] Usuário encontrado:', authUser.id)
      
      // Gerar tokens usando generateAccessToken
      const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateAccessToken(authUser.id)
      
      if (tokenError) {
        console.error('❌ [LOGIN] Erro ao gerar token:', tokenError)
        throw tokenError
      }
      
      session = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || 'refresh_token_placeholder',
        user: authUser
      }
    } else {
      // Criar novo usuário
      console.log('🔄 [LOGIN] Criando novo usuário')
      
      const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: `temp_${Date.now()}`, // Senha temporária
        email_confirm: true,
        user_metadata: {
          username: userData.username,
          cartorio_id: userData.cartorio_id,
          sistema_legado: true
        }
      })

      if (createError) {
        console.error('❌ [LOGIN] Erro ao criar usuário:', createError)
        throw createError
      }

      authUser = newUserData.user
      console.log('✅ [LOGIN] Usuário criado:', authUser.id)

      // Gerar tokens para o novo usuário
      const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateAccessToken(authUser.id)
      
      if (tokenError) {
        console.error('❌ [LOGIN] Erro ao gerar token para novo usuário:', tokenError)
        throw tokenError
      }
      
      session = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || 'refresh_token_placeholder',
        user: authUser
      }
    }

    // 3. Inserir/atualizar dados do usuário na tabela usuarios
    const { error: upsertError } = await supabaseAdmin
      .from('usuarios')
      .upsert({
        id: authUser.id,
        username: userData.username,
        cartorio_id: userData.cartorio_id,
        ativo: true,
        ultimo_login: new Date().toISOString(),
        dados_legado: userData
      }, {
        onConflict: 'id'
      })

    if (upsertError) {
      console.error('❌ [LOGIN] Erro ao salvar dados do usuário:', upsertError)
      // Não falhar por isso, apenas logar
    }

    console.log('🎉 [LOGIN] Login completo com sucesso')

    // 4. Retornar resposta com tokens
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authUser.id,
          username: userData.username,
          cartorio_id: userData.cartorio_id,
          email: authUser.email
        },
        access_token: session.access_token,
        refresh_token: session.refresh_token
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