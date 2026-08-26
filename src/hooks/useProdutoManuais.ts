import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProdutoManual {
  id: string;
  produto_id: string;
  titulo: string;
  descricao: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  ordem: number;
  created_at: string;
}

const BUCKET = 'manuais';

export const useProdutoManuais = (produtoId?: string) =>
  useQuery({
    queryKey: ['produto-manuais', produtoId],
    queryFn: async (): Promise<ProdutoManual[]> => {
      if (!produtoId) return [];
      const { data, error } = await supabase
        .from('produto_manuais')
        .select('*')
        .eq('produto_id', produtoId)
        .order('ordem', { ascending: true });
      if (error) throw error;
      return (data || []) as ProdutoManual[];
    },
    enabled: !!produtoId,
  });

/** Gera URL assinada (bucket privado) válida por 1 hora */
export const getManualUrl = async (storagePath: string, download = false) => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600, download ? { download: true } : undefined);
  if (error) throw error;
  return data.signedUrl;
};

const invoke = async (payload: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('manage-produto-manuais', {
    body: payload,
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const useManualMutations = (produtoId?: string) => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['produto-manuais', produtoId] });

  const upload = useMutation({
    mutationFn: async (input: { titulo: string; descricao?: string; file: File }) => {
      const file_base64 = await fileToBase64(input.file);
      return invoke({
        action: 'upload',
        produto_id: produtoId,
        titulo: input.titulo,
        descricao: input.descricao,
        file_name: input.file.name,
        mime_type: input.file.type,
        file_base64,
      });
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: (input: { id: string; titulo: string; descricao?: string }) =>
      invoke({ action: 'update', ...input }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => invoke({ action: 'delete', id }),
    onSuccess: invalidate,
  });

  return { upload, update, remove };
};

export const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
