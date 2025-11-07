
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useCartorioUsers } from '@/hooks/useCartorioUsers';
import { supabase } from '@/integrations/supabase/client';

interface CartorioUsersManagementProps {
  cartorioId: string;
  cartorioName: string;
}

export const CartorioUsersManagement: React.FC<CartorioUsersManagementProps> = ({
  cartorioId,
  cartorioName
}) => {
  const { users, isLoading, createUser, updateUser, deleteUser } = useCartorioUsers(cartorioId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [trilhas, setTrilhas] = useState<any[]>([]);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    is_active: true,
    active_trilha_id: ''
  });

  // Carregar trilhas disponíveis
  useEffect(() => {
    const loadTrilhas = async () => {
      const { data, error } = await supabase
        .from('trilhas')
        .select('id, nome')
        .order('nome');
      
      if (!error && data) {
        setTrilhas(data);
      }
    };
    loadTrilhas();
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setUserForm({ username: '', email: '', is_active: true, active_trilha_id: '' });
  };

  const handleSaveUser = async () => {
    if (!userForm.username.trim()) {
      return;
    }

    const success = editingUser 
      ? await updateUser(editingUser.id, userForm)
      : await createUser(userForm);

    if (success) {
      handleCloseModal();
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email || '',
      is_active: user.is_active,
      active_trilha_id: user.active_trilha_id || ''
    });
    setIsModalOpen(true);
  };

  const openNewUserModal = () => {
    setEditingUser(null);
    setUserForm({ username: '', email: '', is_active: true, active_trilha_id: '' });
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
              <div>
                <Label htmlFor="active_trilha_id" className="text-gray-300">Trilha Ativa (opcional)</Label>
                <Select
                  value={userForm.active_trilha_id}
                  onValueChange={(value) => setUserForm({...userForm, active_trilha_id: value})}
                >
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione uma trilha ou deixe como usuário comum" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="" className="text-white">
                      Sem trilha (Usuário comum)
                    </SelectItem>
                    {trilhas.map((trilha) => (
                      <SelectItem key={trilha.id} value={trilha.id} className="text-white">
                        {trilha.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  onClick={handleCloseModal}
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
                <TableHead className="text-gray-300">Trilha</TableHead>
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
                    {user.active_trilha_id ? (
                      <Badge className="bg-blue-600 text-white">
                        {trilhas.find(t => t.id === user.active_trilha_id)?.nome || 'Trilha'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-600 text-gray-400">
                        Usuário Comum
                      </Badge>
                    )}
                  </TableCell>
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
                        onClick={() => deleteUser(user)}
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
