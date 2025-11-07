
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users,
  Save,
  X
} from 'lucide-react';
import { useCartorioUsers } from '@/hooks/useCartorioUsers';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CartorioUserManagerProps {
  cartorioId: string;
  cartorioName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface UserForm {
  username: string;
  email: string;
  is_active: boolean;
  active_trilha_id?: string;
}

export const CartorioUserManager: React.FC<CartorioUserManagerProps> = ({
  cartorioId,
  cartorioName,
  isOpen,
  onClose
}) => {
  const { users, isLoading, createUser, updateUser, deleteUser } = useCartorioUsers(cartorioId);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [trilhas, setTrilhas] = useState<any[]>([]);
  const [userForm, setUserForm] = useState<UserForm>({
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

  const handleCreateUser = async () => {
    if (!userForm.username.trim()) {
      toast({
        title: "Nome de usuário obrigatório",
        description: "Digite um nome de usuário válido",
        variant: "destructive",
      });
      return;
    }

    const success = await createUser(userForm);
    if (success) {
      setUserForm({ username: '', email: '', is_active: true });
      setIsCreating(false);
    }
  };

  const handleUpdateUser = async (userId: string) => {
    if (!userForm.username.trim()) {
      toast({
        title: "Nome de usuário obrigatório",
        description: "Digite um nome de usuário válido",
        variant: "destructive",
      });
      return;
    }

    const success = await updateUser(userId, userForm);
    if (success) {
      setEditingUser(null);
      setUserForm({ username: '', email: '', is_active: true });
    }
  };

  const startEdit = (user: any) => {
    setUserForm({
      username: user.username,
      email: user.email || '',
      is_active: Boolean(user.is_active),
      active_trilha_id: user.active_trilha_id || ''
    });
    setEditingUser(user.id);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setIsCreating(false);
    setUserForm({ username: '', email: '', is_active: true, active_trilha_id: '' });
  };

  const handleTrilhaChange = async (userId: string, trilhaId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const success = await updateUser(userId, {
      username: user.username,
      email: user.email,
      is_active: user.is_active,
      active_trilha_id: trilhaId === 'none' ? '' : trilhaId
    });

    if (success) {
      toast({
        title: "Trilha atualizada",
        description: trilhaId === 'none' 
          ? "Usuário marcado como usuário comum"
          : `Trilha atribuída com sucesso ao usuário "${user.username}"`,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-600 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Gerenciar Usuários - {cartorioName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botão para criar novo usuário */}
          <div className="flex justify-end">
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isCreating || editingUser !== null}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>

          {/* Formulário de criação */}
          {isCreating && (
            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-green-400">Criar Novo Usuário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Nome de Usuário *</Label>
                    <Input
                      value={userForm.username}
                      onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                      className="bg-gray-600 border-gray-500 text-white"
                      placeholder="Digite o nome de usuário"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Email</Label>
                    <Input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      className="bg-gray-600 border-gray-500 text-white"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={userForm.is_active}
                    onCheckedChange={(checked: boolean) => setUserForm({...userForm, is_active: checked})}
                  />
                  <Label className="text-gray-300">Usuário ativo</Label>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreateUser}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Criar Usuário
                  </Button>
                  <Button
                    onClick={cancelEdit}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de usuários */}
          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user.id} className="bg-gray-700/50 border-gray-600">
                <CardContent className="p-4">
                  {editingUser === user.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300">Nome de Usuário *</Label>
                          <Input
                            value={userForm.username}
                            onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                            className="bg-gray-600 border-gray-500 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300">Email</Label>
                          <Input
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                            className="bg-gray-600 border-gray-500 text-white"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={userForm.is_active}
                          onCheckedChange={(checked: boolean) => setUserForm({...userForm, is_active: checked})}
                        />
                        <Label className="text-gray-300">Usuário ativo</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleUpdateUser(user.id)}
                          disabled={isLoading}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                        <Button
                          onClick={cancelEdit}
                          variant="outline"
                          className="border-gray-600 text-gray-300"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex items-center space-x-3">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{user.username}</h4>
                          {user.email && (
                            <p className="text-gray-400 text-sm">{user.email}</p>
                          )}
                          <p className="text-gray-500 text-xs">
                            Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge 
                          variant={user.is_active ? 'secondary' : 'destructive'}
                          className={user.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
                        >
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        {/* Dropdown de Trilha */}
                        <div className="flex flex-col items-start">
                          <Label className="text-gray-400 text-xs mb-1">Atribuir Trilha</Label>
                          <Select
                            value={user.active_trilha_id || 'none'}
                            onValueChange={(value) => handleTrilhaChange(user.id, value)}
                            disabled={editingUser !== null || isCreating}
                          >
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600 z-50">
                              <SelectItem value="none" className="text-white">
                                Usuário Comum
                              </SelectItem>
                              {trilhas.map((trilha) => (
                                <SelectItem key={trilha.id} value={trilha.id} className="text-white">
                                  {trilha.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Botões de ação */}
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(user)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                            disabled={editingUser !== null || isCreating}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteUser(user)}
                            className="border-red-600 text-red-400 hover:bg-red-700/20"
                            disabled={editingUser !== null || isCreating}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum usuário cadastrado</p>
                <p className="text-gray-500 text-sm mt-2">
                  Clique em "Novo Usuário" para adicionar o primeiro usuário
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
