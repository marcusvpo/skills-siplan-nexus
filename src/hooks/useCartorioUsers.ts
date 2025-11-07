
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CartorioUser {
  id: string;
  username: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  active_trilha_id?: string;
}

export const useCartorioUsers = (cartorioId: string) => {
  const [users, setUsers] = useState<CartorioUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUsers = async () => {
    if (!cartorioId) return;
    
    setIsLoading(true);
    try {
      console.log('Loading users for cartorio:', cartorioId);
      const { data, error } = await supabase
        .from('cartorio_usuarios')
        .select('*')
        .eq('cartorio_id', cartorioId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        throw error;
      }
      
      console.log('Users loaded:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (userData: { username: string; email?: string; is_active: boolean; active_trilha_id?: string }) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('cartorio_usuarios')
        .insert({
          cartorio_id: cartorioId,
          username: userData.username.trim(),
          email: userData.email?.trim() || null,
          is_active: userData.is_active,
          active_trilha_id: userData.active_trilha_id || null
        });

      if (error) throw error;

      toast({
        title: "Usuário criado",
        description: `O usuário "${userData.username}" foi criado com sucesso.`,
      });

      await loadUsers();
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: { username: string; email?: string; is_active: boolean; active_trilha_id?: string }) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('cartorio_usuarios')
        .update({
          username: userData.username.trim(),
          email: userData.email?.trim() || null,
          is_active: userData.is_active,
          active_trilha_id: userData.active_trilha_id || null
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Usuário atualizado",
        description: `O usuário "${userData.username}" foi atualizado com sucesso.`,
      });

      await loadUsers();
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Erro ao atualizar usuário",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (user: CartorioUser) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.username}"?`)) {
      return false;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('cartorio_usuarios')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Usuário excluído",
        description: `O usuário "${user.username}" foi excluído com sucesso.`,
      });

      await loadUsers();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro ao excluir usuário",
        description: "Ocorreu um erro ao excluir o usuário.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [cartorioId]);

  return {
    users,
    isLoading,
    loadUsers,
    createUser,
    updateUser,
    deleteUser
  };
};
