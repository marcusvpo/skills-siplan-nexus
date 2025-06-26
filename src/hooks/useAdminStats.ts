
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      // Cartórios ativos (considerando o novo campo is_active)
      const { count: cartoriosAtivos } = await supabase
        .from('cartorios')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Total de videoaulas
      const { count: totalVideoaulas } = await supabase
        .from('video_aulas')
        .select('*', { count: 'exact', head: true });

      // Acessos expirando (próximos 30 dias)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count: acessosExpirando } = await supabase
        .from('acessos_cartorio')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)
        .lt('data_expiracao', thirtyDaysFromNow.toISOString());

      // Novos cadastros (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: novosCadastros } = await supabase
        .from('cartorios')
        .select('*', { count: 'exact', head: true })
        .gte('data_cadastro', sevenDaysAgo.toISOString());

      return {
        cartoriosAtivos: cartoriosAtivos || 0,
        totalVideoaulas: totalVideoaulas || 0,
        acessosExpirando: acessosExpirando || 0,
        novosCadastros: novosCadastros || 0
      };
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
};

export const useCartoriosList = (shouldRefetch: boolean = false) => {
  return useQuery({
    queryKey: ['cartoriosList', shouldRefetch],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cartorios')
        .select(`
          *,
          acessos_cartorio (
            login_token,
            data_expiracao,
            email_contato,
            ativo
          )
        `)
        .order('data_cadastro', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: shouldRefetch ? 5000 : false,
  });
};

export const useUpdateCartorio = () => {
  return async (cartorioId: string, updates: any) => {
    const { error } = await supabase
      .from('cartorios')
      .update(updates)
      .eq('id', cartorioId);
    
    if (error) throw error;
  };
};

export const useUpdateTokenExpiration = () => {
  return async (cartorioId: string, newDate: string) => {
    const { error } = await supabase
      .from('acessos_cartorio')
      .update({ data_expiracao: newDate })
      .eq('cartorio_id', cartorioId);
    
    if (error) throw error;
  };
};
