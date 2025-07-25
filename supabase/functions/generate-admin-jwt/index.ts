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
    
    // Verificar se o token é válido fazendo uma requisição com ele
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/admins?select=*&email=eq.${req.url.includes('email=') ? new URL(req.url).searchParams.get('email') : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || ''
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Token inválido ou usuário não é admin' }), {
        status: 401,
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