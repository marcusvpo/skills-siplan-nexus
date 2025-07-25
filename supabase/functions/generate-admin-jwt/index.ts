// Edge function para gerar JWT customizado para admins autenticados
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SignJWT } from 'https://deno.land/x/jose@v4.14.6/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Extrair token do Supabase Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Token de autorização obrigatório' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar se o token é válido usando Supabase Auth
    let userEmail = null;
    
    try {
      // Criar cliente Supabase para verificação
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceKey = Deno.env.get('CUSTOM_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': serviceKey || ''
        }
      });

      if (!response.ok) {
        throw new Error('Token inválido');
      }

      const userData = await response.json();
      userEmail = userData.email;
      
      if (!userEmail) {
        throw new Error('Email não encontrado no token');
      }
      
    } catch (authError) {
      return new Response(JSON.stringify({ error: 'Token inválido ou expirado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se o usuário é admin
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/admins?select=*&email=eq.${userEmail}`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('CUSTOM_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Erro ao verificar status de admin' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const adminData = await response.json();
    if (!adminData || adminData.length === 0) {
      return new Response(JSON.stringify({ error: 'Usuário não é administrador' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Gerar JWT customizado para admin
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      return new Response(JSON.stringify({ error: 'JWT secret não configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const customJWT = await new SignJWT({
      role: 'admin',
      is_admin: true,
      email: adminData[0].email,
      admin_id: adminData[0].id,
      iss: 'siplan-admin',
      aud: 'siplan-admin-panel'
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

    return new Response(
      JSON.stringify({ 
        success: true, 
        adminJWT: customJWT,
        adminData: adminData[0]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [generate-admin-jwt] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})