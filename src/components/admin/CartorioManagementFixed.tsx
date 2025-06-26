
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Users, 
  Calendar,
  Save,
  X,
  Loader2,
  Building
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CartorioUsersManagementFixed } from './CartorioUsersManagementFixed';
import { EditTokenModal } from './EditTokenModal';

interface Cartorio {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
  is_active: boolean;
  data_cadastro: string;
  acessos_cartorio?: Array<{
    id: string;
    login_token: string;
    data_expiracao: string;
    ativo: boolean;
    email_contato?: string;
  }>;
}

interface NewCartorioForm {
  nome: string;
  cidade: string;
  estado: string;
  email_contato: string;
  data_expiracao: string;
  observacoes: string;
}

interface EditCartorioForm {
  nome: string;
  cidade: string;
  estado: string;
  observacoes: string;
  is_active: boolean;
}

export const CartorioManagementFixed: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedCartorio, setSelectedCartorio] = useState<Cartorio | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [expandedCartorio, setExpandedCartorio] = useState<string | null>(null);
  const [editingCartorio, setEditingCartorio] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newCartorioForm, setNewCartorioForm] = useState<NewCartorioForm>({
    nome: '',
    cidade: '',
    estado: '',
    email_contato: '',
    data_expiracao: '',
    observacoes: ''
  });
  const [editCartorioForm, setEditCartorioForm] = useState<EditCartorioForm>({
    nome: '',
    cidade: '',
    estado: '',
    observacoes: '',
    is_active: true
  });

  const queryClient = useQueryClient();

  // Load cartórios with access data
  const { data: cartorios, isLoading, refetch } = useQuery({
    queryKey: ['cartorios-fixed'],
    queryFn: async () => {
      console.log('Loading cartorios...');
      const { data, error } = await supabase
        .from('cartorios')
        .select(`
          *,
          acessos_cartorio (*)
        `)
        .order('nome', { ascending: true });
      
      if (error) {
        console.error('Error loading cartorios:', error);
        throw error;
      }
      console.log('Cartorios loaded successfully:', data);
      return data || [];
    }
  });

  // Create new cartório with token
  const handleCreateCartorio = async () => {
    if (!newCartorioForm.nome || !newCartorioForm.cidade || !newCartorioForm.estado || !newCartorioForm.email_contato || !newCartorioForm.data_expiracao) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      console.log('Creating cartorio with data:', newCartorioForm);
      
      // Create cartório
      const { data: cartorio, error: cartorioError } = await supabase
        .from('cartorios')
        .insert({
          nome: newCartorioForm.nome,
          cidade: newCartorioForm.cidade,
          estado: newCartorioForm.estado,
          observacoes: newCartorioForm.observacoes || null,
          is_active: true
        })
        .select()
        .single();

      if (cartorioError) {
        console.error('Error creating cartorio:', cartorioError);
        throw cartorioError;
      }

      console.log('Cartorio created:', cartorio);

      // Generate unique token
      const loginToken = `CART-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Create access
      const { error: acessoError } = await supabase
        .from('acessos_cartorio')
        .insert({
          login_token: loginToken,
          cartorio_id: cartorio.id,
          data_expiracao: newCartorioForm.data_expiracao,
          email_contato: newCartorioForm.email_contato,
          ativo: true
        });

      if (acessoError) {
        console.error('Error creating access:', acessoError);
        throw acessoError;
      }

      toast({
        title: "Cartório criado com sucesso!",
        description: `Token gerado: ${loginToken}`,
        duration: 10000,
      });

      // Reset form and refresh data
      setNewCartorioForm({
        nome: '',
        cidade: '',
        estado: '',
        email_contato: '',
        data_expiracao: '',
        observacoes: ''
      });
      
      setActiveTab('list');
      refetch();
    } catch (error) {
      console.error('Error creating cartorio:', error);
      toast({
        title: "Erro ao criar cartório",
        description: "Ocorreu um erro ao criar o cartório.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Start editing cartório
  const handleStartEdit = (cartorio: Cartorio) => {
    console.log('Starting edit for cartorio:', cartorio.id);
    setEditCartorioForm({
      nome: cartorio.nome,
      cidade: cartorio.cidade || '',
      estado: cartorio.estado || '',
      observacoes: cartorio.observacoes || '',
      is_active: cartorio.is_active
    });
    setEditingCartorio(cartorio.id);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    console.log('Canceling edit');
    setEditingCartorio(null);
    setEditCartorioForm({
      nome: '',
      cidade: '',
      estado: '',
      observacoes: '',
      is_active: true
    });
  };

  // Update cartório
  const handleUpdateCartorio = async (cartorioId: string) => {
    if (!editCartorioForm.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do cartório é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      console.log('Updating cartorio:', cartorioId, editCartorioForm);
      
      const { error } = await supabase
        .from('cartorios')
        .update({
          nome: editCartorioForm.nome.trim(),
          cidade: editCartorioForm.cidade.trim() || null,
          estado: editCartorioForm.estado.trim() || null,
          observacoes: editCartorioForm.observacoes.trim() || null,
          is_active: editCartorioForm.is_active
        })
        .eq('id', cartorioId);

      if (error) {
        console.error('Error updating cartorio:', error);
        throw error;
      }

      toast({
        title: "Cartório atualizado",
        description: "Dados do cartório foram salvos com sucesso",
      });

      setEditingCartorio(null);
      refetch();
    } catch (error) {
      console.error('Error updating cartorio:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete cartório
  const handleDeleteCartorio = async (cartorio: Cartorio) => {
    const confirmText = `Tem certeza que deseja deletar "${cartorio.nome}"? Esta ação é irreversível e removerá todos os dados associados.`;
    
    if (!confirm(confirmText)) return;

    try {
      console.log('Deleting cartorio:', cartorio.id);
      
      // Delete related data first
      const { error: visualizacoesError } = await supabase
        .from('visualizacoes_cartorio')
        .delete()
        .eq('cartorio_id', cartorio.id);

      const { error: favoritosError } = await supabase
        .from('favoritos_cartorio')
        .delete()
        .eq('cartorio_id', cartorio.id);

      const { error: usuariosError } = await supabase
        .from('cartorio_usuarios')
        .delete()
        .eq('cartorio_id', cartorio.id);

      const { error: acessosError } = await supabase
        .from('acessos_cartorio')
        .delete()
        .eq('cartorio_id', cartorio.id);

      const { error: cartorioError } = await supabase
        .from('cartorios')
        .delete()
        .eq('id', cartorio.id);

      if (visualizacoesError || favoritosError || usuariosError || acessosError || cartorioError) {
        throw new Error('Erro ao deletar cartório e dados associados');
      }

      toast({
        title: "Cartório deletado",
        description: `O cartório "${cartorio.nome}" foi removido com sucesso`,
      });

      refetch();
    } catch (error) {
      console.error('Error deleting cartorio:', error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar o cartório",
        variant: "destructive",
      });
    }
  };

  // Copy token to clipboard
  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast({
        title: "Token copiado!",
        description: "Token copiado para a área de transferência",
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o token",
        variant: "destructive",
      });
    }
  };

  // Toggle user expansion
  const handleToggleUserExpansion = (cartorioId: string) => {
    console.log('Toggling user expansion for cartorio:', cartorioId);
    setExpandedCartorio(expandedCartorio === cartorioId ? null : cartorioId);
  };

  // Set default expiration date (1 year from now)
  React.useEffect(() => {
    if (!newCartorioForm.data_expiracao) {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      setNewCartorioForm(prev => ({
        ...prev,
        data_expiracao: oneYearFromNow.toISOString().split('T')[0]
      }));
    }
  }, [newCartorioForm.data_expiracao]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400 mr-3" />
        <span className="text-white">Carregando cartórios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger 
            value="list" 
            className="text-gray-300 data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            <Building className="h-4 w-4 mr-2" />
            Gerenciar Cartórios
          </TabsTrigger>
          <TabsTrigger 
            value="create" 
            className="text-gray-300 data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Novo Cartório
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {cartorios?.map((cartorio) => (
            <Card key={cartorio.id} className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {editingCartorio === cartorio.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-gray-300 text-sm">Nome do Cartório</Label>
                            <Input
                              value={editCartorioForm.nome}
                              onChange={(e) => setEditCartorioForm({...editCartorioForm, nome: e.target.value})}
                              className="bg-gray-700/50 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-gray-300 text-sm">Cidade</Label>
                            <Input
                              value={editCartorioForm.cidade}
                              onChange={(e) => setEditCartorioForm({...editCartorioForm, cidade: e.target.value})}
                              className="bg-gray-700/50 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-gray-300 text-sm">Estado</Label>
                            <Input
                              value={editCartorioForm.estado}
                              onChange={(e) => setEditCartorioForm({...editCartorioForm, estado: e.target.value})}
                              className="bg-gray-700/50 border-gray-600 text-white"
                              maxLength={2}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={editCartorioForm.is_active}
                              onCheckedChange={(checked) => setEditCartorioForm({...editCartorioForm, is_active: checked})}
                            />
                            <Label className="text-gray-300 text-sm">Cartório ativo</Label>
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm">Observações</Label>
                          <Textarea
                            value={editCartorioForm.observacoes}
                            onChange={(e) => setEditCartorioForm({...editCartorioForm, observacoes: e.target.value})}
                            className="bg-gray-700/50 border-gray-600 text-white"
                            rows={2}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleUpdateCartorio(cartorio.id)}
                            disabled={isUpdating}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Save className="h-4 w-4 mr-1" />
                            )}
                            Salvar
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center space-x-3">
                          <CardTitle className="text-white">{cartorio.nome}</CardTitle>
                          <Badge 
                            variant={cartorio.is_active ? 'secondary' : 'destructive'}
                            className={cartorio.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
                          >
                            {cartorio.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        {cartorio.cidade && cartorio.estado && (
                          <p className="text-gray-400 mt-1">{cartorio.cidade}, {cartorio.estado}</p>
                        )}
                        {cartorio.observacoes && (
                          <p className="text-gray-500 text-sm mt-1">{cartorio.observacoes}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {editingCartorio !== cartorio.id && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartEdit(cartorio)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleUserExpansion(cartorio.id)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCartorio(cartorio)}
                        className="border-red-600 text-red-400 hover:bg-red-700/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              {editingCartorio !== cartorio.id && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Token Info */}
                    <div>
                      <Label className="text-gray-300">Token de Acesso</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="text-sm bg-gray-700 px-2 py-1 rounded text-green-400">
                          {cartorio.acessos_cartorio?.[0]?.login_token || 'N/A'}
                        </code>
                        {cartorio.acessos_cartorio?.[0]?.login_token && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyToken(cartorio.acessos_cartorio[0].login_token)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expiration Info */}
                    <div>
                      <Label className="text-gray-300">Validade do Token</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-400">
                          {cartorio.acessos_cartorio?.[0]?.data_expiracao 
                            ? new Date(cartorio.acessos_cartorio[0].data_expiracao).toLocaleDateString('pt-BR')
                            : 'N/A'
                          }
                        </span>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCartorio(cartorio);
                            setIsTokenModalOpen(true);
                          }}
                          className="h-6 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content - User Management */}
                  {expandedCartorio === cartorio.id && (
                    <div className="mt-6 pt-6 border-t border-gray-600">
                      <CartorioUsersManagementFixed 
                        cartorioId={cartorio.id} 
                        cartorioName={cartorio.nome}
                      />
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}

          {cartorios?.length === 0 && (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Nenhum cartório cadastrado</p>
              <p className="text-gray-500 text-sm mt-2">
                Clique em "Criar Novo Cartório" para começar
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Plus className="h-5 w-5 mr-2 text-red-500" />
                Criar Novo Cartório
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome" className="text-gray-300">Nome do Cartório *</Label>
                  <Input
                    id="nome"
                    value={newCartorioForm.nome}
                    onChange={(e) => setNewCartorioForm({...newCartorioForm, nome: e.target.value})}
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Ex: Cartório de Registro Civil"
                  />
                </div>
                <div>
                  <Label htmlFor="cidade" className="text-gray-300">Cidade *</Label>
                  <Input
                    id="cidade"
                    value={newCartorioForm.cidade}
                    onChange={(e) => setNewCartorioForm({...newCartorioForm, cidade: e.target.value})}
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Ex: São Paulo"
                  />
                </div>
                <div>
                  <Label htmlFor="estado" className="text-gray-300">Estado *</Label>
                  <Input
                    id="estado"
                    value={newCartorioForm.estado}
                    onChange={(e) => setNewCartorioForm({...newCartorioForm, estado: e.target.value})}
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Ex: SP"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email de Contato *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCartorioForm.email_contato}
                    onChange={(e) => setNewCartorioForm({...newCartorioForm, email_contato: e.target.value})}
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                    placeholder="contato@cartorio.com.br"
                  />
                </div>
                <div>
                  <Label htmlFor="expiracao" className="text-gray-300">Data de Expiração *</Label>
                  <Input
                    id="expiracao"
                    type="date"
                    value={newCartorioForm.data_expiracao}
                    onChange={(e) => setNewCartorioForm({...newCartorioForm, data_expiracao: e.target.value})}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="observacoes" className="text-gray-300">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={newCartorioForm.observacoes}
                    onChange={(e) => setNewCartorioForm({...newCartorioForm, observacoes: e.target.value})}
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                    placeholder="Observações sobre o cartório..."
                    rows={3}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleCreateCartorio}
                disabled={isCreating}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando Cartório...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Cartório e Gerar Token
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Token Edit Modal */}
      {selectedCartorio && (
        <EditTokenModal
          isOpen={isTokenModalOpen}
          onClose={() => {
            setIsTokenModalOpen(false);
            setSelectedCartorio(null);
          }}
          cartorio={selectedCartorio}
          onUpdate={refetch}
        />
      )}
    </div>
  );
};
