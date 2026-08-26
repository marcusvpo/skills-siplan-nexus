import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });

const sanitizeFileName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(-120) || 'arquivo';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // --- Validação de admin (JWT do Supabase Auth + tabela admins) ---
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return json({ error: 'Autenticação obrigatória' }, 401);

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error('[manage-produto-manuais] token inválido', userError);
      return json({ error: 'Token inválido ou expirado' }, 401);
    }

    const { data: adminRow } = await admin
      .from('admins')
      .select('id')
      .eq('email', userData.user.email)
      .maybeSingle();

    if (!adminRow) return json({ error: 'Usuário não é administrador' }, 403);

    const body = await req.json();
    const action = String(body?.action || '');

    if (action === 'upload') {
      const { produto_id, titulo, descricao, file_name, mime_type, file_base64 } = body;
      if (!produto_id || !titulo || !file_name || !file_base64) {
        return json({ error: 'Dados obrigatórios: produto_id, titulo, file_name, file_base64' }, 400);
      }

      const binary = Uint8Array.from(atob(String(file_base64)), (c) => c.charCodeAt(0));
      if (binary.byteLength > 50 * 1024 * 1024) {
        return json({ error: 'Arquivo maior que 50MB' }, 400);
      }

      const path = `${produto_id}/${Date.now()}-${sanitizeFileName(String(file_name))}`;

      const { error: uploadError } = await admin.storage
        .from('manuais')
        .upload(path, binary, {
          contentType: mime_type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        console.error('[manage-produto-manuais] erro upload', uploadError);
        return json({ error: `Falha no upload: ${uploadError.message}` }, 400);
      }

      const { count } = await admin
        .from('produto_manuais')
        .select('id', { count: 'exact', head: true })
        .eq('produto_id', produto_id);

      const { data: inserted, error: insertError } = await admin
        .from('produto_manuais')
        .insert({
          produto_id,
          titulo: String(titulo).trim(),
          descricao: descricao ? String(descricao).trim() : null,
          storage_path: path,
          file_name: String(file_name),
          mime_type: mime_type || null,
          file_size: binary.byteLength,
          ordem: (count || 0) + 1,
        })
        .select()
        .single();

      if (insertError) {
        await admin.storage.from('manuais').remove([path]);
        console.error('[manage-produto-manuais] erro insert', insertError);
        return json({ error: insertError.message }, 400);
      }

      return json({ success: true, manual: inserted });
    }

    if (action === 'update') {
      const { id, titulo, descricao } = body;
      if (!id || !titulo) return json({ error: 'Dados obrigatórios: id, titulo' }, 400);

      const { data: updated, error } = await admin
        .from('produto_manuais')
        .update({
          titulo: String(titulo).trim(),
          descricao: descricao ? String(descricao).trim() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return json({ error: error.message }, 400);
      return json({ success: true, manual: updated });
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) return json({ error: 'Dados obrigatórios: id' }, 400);

      const { data: manual } = await admin
        .from('produto_manuais')
        .select('storage_path')
        .eq('id', id)
        .maybeSingle();

      if (manual?.storage_path) {
        await admin.storage.from('manuais').remove([manual.storage_path]);
      }

      const { error } = await admin.from('produto_manuais').delete().eq('id', id);
      if (error) return json({ error: error.message }, 400);

      return json({ success: true });
    }

    return json({ error: 'Ação inválida' }, 400);
  } catch (error) {
    console.error('[manage-produto-manuais] erro inesperado', error);
    return json({ error: (error as Error).message }, 500);
  }
});
