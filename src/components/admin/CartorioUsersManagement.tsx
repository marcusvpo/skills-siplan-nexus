
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Loader2, Users } from 'lucide-react';
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
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    is_active: true
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setUserForm({ username: '', email: '', is_active: true });
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
      is_active: user.is_active
    });
    setIsModalOpen(true);
  };

  const openNewUserModal = () => {
    setEditingUser(null);
    setUserForm({ username: '', email: '', is_active: true });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-lg font-semibold truncate">
          Usuários Cadastrados para {cartorioName}
        </h4>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button variant="glow" onClick={openNewUserModal}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card/95 backdrop-blur-md border-border/50 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Users className="h-5 w-5" />
                </span>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  value={userForm.username}
                  onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  placeholder="Digite o nome de usuário"
                />
              </div>
              <div>
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={userForm.is_active}
                  onCheckedChange={(checked) => setUserForm({...userForm, is_active: Boolean(checked)})}
                />
                <Label htmlFor="is_active">Usuário ativo</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button
                  variant="glow"
                  onClick={handleSaveUser}
                  disabled={isLoading}
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
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && !isModalOpen ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Carregando usuários...</span>
        </div>
      ) : users.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium truncate max-w-[160px]">{user.username}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[200px]">{user.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.is_active ? 'secondary' : 'destructive'}
                      className={user.is_active ? 'bg-success text-success-foreground' : ''}
                    >
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUser(user)}
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
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
          <p className="text-muted-foreground">Nenhum usuário cadastrado para este cartório</p>
          <p className="text-muted-foreground/70 text-sm mt-2">
            Clique em "Adicionar Usuário" para criar o primeiro usuário
          </p>
        </div>
      )}
    </div>
  );
};
