
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CartorioUser {
  id: string;
  username: string;
  email?: string;
  is_active: boolean;
  created_at: string;
}

interface CartorioUsersManagementProps {
  cartorioId: string;
  cartorioName: string;
}

export const CartorioUsersManagement: React.FC<CartorioUsersManagementProps> = ({
  cartorioId,
  cartorioName
}) => {
  const [users, setUsers] = useState<CartorioUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CartorioUser | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    is_active: true
  });

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cartorio_usuarios')
        .select('*')
        .eq('cartorio_id', cartorioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
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

  useEffect(() => {
    loadUsers();
  }, [cartorioId]);

  const handleSaveUser = async () => {
    if (!userForm.username.trim()) {
      toast({
        title: "Dados incompletos",
        description: "O nome de usuário é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (editingUser) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('cartorio_usuarios')
          .update({
            username: userForm.username.trim(),
            email: userForm.email.trim() || null,
            is_active: userForm.is_active
          })
          .eq('id', editingUser.id);

        if (error) throw error;

        toast({
          title: "Usuário atualizado",
          description: `O usuário "${userForm.username}" foi atualizado com sucesso.`,
        });
      } else {
        // Criar novo usuário
        const { error } = await supabase
          .from('cartorio_usuarios')
          .insert({
            cartorio_id: cartorioId,
            username: userForm.username.trim(),
            email: userForm.email.trim() || null,
            is_active: userForm.is_active
          });

        if (error) throw error;

        toast({
          title: "Usuário criado",
          description: `O usuário "${userForm.username}" foi criado com sucesso.`,
        });
      }

      setIsModalOpen(false);
      setEditingUser(null);
      setUserForm({ username: '', email: '', is_active: true });
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Erro ao salvar usuário",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: CartorioUser) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email || '',
      is_active: user.is_active
    });
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (user: CartorioUser) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.username}"?`)) {
      return;
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

      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro ao excluir usuário",
        description: "Ocorreu um erro ao excluir o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openNewUserModal = () => {
    setEditingUser(null);
    setUserForm({ username: '', email: '', is_active: true });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white">
          Usuários Cadastrados para {cartorioName}
        </h4>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openNewUserModal}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-gray-300">Nome de Usuário</Label>
                <Input
                  id="username"
                  value={userForm.username}
                  onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                  placeholder="Digite o nome de usuário"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-300">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={userForm.is_active}
                  onChange={(e) => setUserForm({...userForm, is_active: e.target.checked})}
                  className="rounded border-gray-600"
                />
                <Label htmlFor="is_active" className="text-gray-300">Usuário ativo</Label>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleSaveUser}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingUser ? 'Atualizar' : 'Criar'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && !isModalOpen ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">Carregando usuários...</span>
        </div>
      ) : users.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-600">
                <TableHead className="text-gray-300">Usuário</TableHead>
                <TableHead className="text-gray-300">Email</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Criado em</TableHead>
                <TableHead className="text-gray-300">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-gray-700 hover:bg-gray-700/30">
                  <TableCell className="font-medium text-white">{user.username}</TableCell>
                  <TableCell className="text-gray-300">{user.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.is_active ? 'secondary' : 'destructive'}
                      className={user.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
                    >
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        className="border-red-600 text-red-400 hover:bg-red-700/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400">Nenhum usuário cadastrado para este cartório</p>
          <p className="text-gray-500 text-sm mt-2">
            Clique em "Adicionar Usuário" para criar o primeiro usuário
          </p>
        </div>
      )}
    </div>
  );
};
