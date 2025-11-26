import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building, Plus, Edit, Trash2, Users, Key, Shield, Loader2, Search, ChevronRight, ChevronDown } from 'lucide-react';
import { useCartoriosWithAcessos } from '@/hooks/useSupabaseDataRefactored';
import { CartorioUserManager } from './CartorioUserManager';
import { CartorioPermissionsManager } from './CartorioPermissionsManager';
import { EditTokenModal } from './EditTokenModal';
import { CartorioStatusIndicator } from './CartorioStatusIndicator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const CartorioManagementComplete: React.FC = () => {
  const { data: cartorios, isLoading, refetch } = useCartoriosWithAcessos();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCartorioId, setExpandedCartorioId] = useState<string | null>(null);
  const [selectedCartorio, setSelectedCartorio] = useState<any>(null);
  const [userManagerOpen, setUserManagerOpen] = useState(false);
  const [permissionsManagerOpen, setPermissionsManagerOpen] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cidade: '',
    estado: 'SP',
    observacoes: '',
    data_expiracao: ''
  });

  const handleOpenUserManager = (cartorio: any) => {
    setSelectedCartorio(cartorio);
    setUserManagerOpen(true);
  };

  const handleOpenPermissions = (cartorio: any) => {
    setSelectedCartorio(cartorio);
    setPermissionsManagerOpen(true);
  };

  const handleOpenTokenModal = (cartorio: any) => {
    setSelectedCartorio(cartorio);
    setTokenModalOpen(true);
  };

  const handleOpenEditModal = (cartorio: any) => {
    setSelectedCartorio(cartorio);
    setFormData({
      nome: cartorio.nome,
      cidade: cartorio.cidade || '',
      estado: cartorio.estado || 'SP',
      observacoes: cartorio.observacoes || '',
      data_expiracao: ''
    });
    setEditModalOpen(true);
  };

  const handleCreateCartorio = async () => {
    if (!formData.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o cartório",
        variant: "destructive",
      });
      return;
    }

    if (!formData.data_expiracao) {
      toast({
        title: "Data de expiração obrigatória",
        description: "Selecione uma data de expiração",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Criar cartório
      const { data: cartorio, error: cartorioError } = await supabase
        .from('cartorios')
        .insert({
          nome: formData.nome.trim(),
          cidade: formData.cidade?.trim() || null,
          estado: formData.estado?.trim() || 'SP',
          observacoes: formData.observacoes?.trim() || null,
          is_active: true
        })
        .select()
        .single();

      if (cartorioError) throw cartorioError;

      // Gerar token
      const timestamp = Date.now().toString();
      const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      const login_token = `CART${timestamp.slice(-8)}${randomNum}`;

      // Criar acesso
      const { error: acessoError } = await supabase
        .from('acessos_cartorio')
        .insert({
          login_token,
          cartorio_id: cartorio.id,
          data_expiracao: formData.data_expiracao,
          ativo: true
        });

      if (acessoError) {
        // Limpar cartório criado
        await supabase.from('cartorios').delete().eq('id', cartorio.id);
        throw acessoError;
      }

      toast({
        title: "Cartório criado com sucesso!",
        description: `Token gerado: ${login_token}`,
      });

      setFormData({ nome: '', cidade: '', estado: 'SP', observacoes: '', data_expiracao: '' });
      setCreateModalOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao criar cartório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCartorio = async () => {
    if (!selectedCartorio) return;

    try {
      const { error } = await supabase
        .from('cartorios')
        .update({
          nome: formData.nome.trim(),
          cidade: formData.cidade?.trim() || null,
          estado: formData.estado?.trim() || 'SP',
          observacoes: formData.observacoes?.trim() || null
        })
        .eq('id', selectedCartorio.id);

      if (error) throw error;

      toast({
        title: "Cartório atualizado com sucesso!",
      });

      setEditModalOpen(false);
      setSelectedCartorio(null);
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar cartório",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCartorio = async (cartorio: any) => {
    if (!confirm(`Tem certeza que deseja excluir o cartório "${cartorio.nome}"?`)) return;

    try {
      const { error } = await supabase
        .from('cartorios')
        .delete()
        .eq('id', cartorio.id);

      if (error) throw error;

      toast({
        title: "Cartório excluído com sucesso!",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir cartório",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-600">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-red-400 mr-3" />
          <span className="text-white">Carregando cartórios...</span>
        </CardContent>
      </Card>
    );
  }

  const filteredCartorios = (cartorios || []).filter((cartorio: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    return (
      (cartorio.nome && cartorio.nome.toLowerCase().includes(term)) ||
      (cartorio.cidade && cartorio.cidade.toLowerCase().includes(term))
    );
  });

  return (
    <>
      <div className="space-y-6">
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Cartórios Cadastrados ({cartorios?.length || 0})
              </CardTitle>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Cartório
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar cartório por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-gray-900/60 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <Badge variant="outline" className="border-gray-700 text-gray-300">
                {filteredCartorios.length} cartório{filteredCartorios.length === 1 ? '' : 's'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredCartorios.map((cartorio: any, index: number) => {
                const isExpanded = expandedCartorioId === cartorio.id;

                return (
                  <Card
                    key={cartorio.id}
                    className="bg-gray-800/60 border border-gray-700/80 hover:border-red-500/60 transition-colors rounded-xl"
                  >
                    <CardContent className="p-4">
                      <button
                        type="button"
                        onClick={() => setExpandedCartorioId(isExpanded ? null : cartorio.id)}
                        className="flex w-full items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-gray-500">#{index + 1}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{cartorio.nome}</p>
                            {cartorio.cidade && cartorio.estado && (
                              <p className="text-xs text-gray-400 truncate">
                                {cartorio.cidade} - {cartorio.estado}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <CartorioStatusIndicator
                            isActive={cartorio.is_active}
                            lastActivity={cartorio.acessos_cartorio?.[0]?.data_criacao || null}
                          />
                          {cartorio.acessos_cartorio?.[0]?.data_expiracao && (
                            <span className="hidden text-xs text-gray-500 sm:inline-flex">
                              Expira em {new Date(cartorio.acessos_cartorio[0].data_expiracao).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-4 border-t border-gray-700 pt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-1 text-sm text-gray-300">
                            {cartorio.observacoes && (
                              <p className="text-gray-400">{cartorio.observacoes}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              Tokens: {cartorio.acessos_cartorio?.length || 0}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 md:justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleOpenUserManager(cartorio)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Users className="mr-1 h-4 w-4" />
                              Usuários
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleOpenPermissions(cartorio)}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Shield className="mr-1 h-4 w-4" />
                              Permissões
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleOpenTokenModal(cartorio)}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <Key className="mr-1 h-4 w-4" />
                              Token
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditModal(cartorio)}
                              className="border-gray-600 text-gray-300"
                            >
                              <Edit className="h-4 w-4" />
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
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {filteredCartorios.length === 0 && (
                <div className="col-span-full py-8 text-center text-sm text-gray-400">
                  {'Nenhum cartório encontrado' + (searchTerm ? ' para "' + searchTerm + '"' : '') + '.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Criação */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-600 text-white">
          <DialogHeader>
            <DialogTitle>Criar Novo Cartório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Nome do Cartório *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Estado</Label>
                <Input
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  maxLength={2}
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Data de Expiração *</Label>
              <Input
                type="date"
                value={formData.data_expiracao}
                onChange={(e) => setFormData({ ...formData, data_expiracao: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Observações</Label>
              <Input
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="border-gray-600">
                Cancelar
              </Button>
              <Button onClick={handleCreateCartorio} disabled={isCreating} className="bg-green-600 hover:bg-green-700">
                {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Criar Cartório
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-600 text-white">
          <DialogHeader>
            <DialogTitle>Editar Cartório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Nome do Cartório *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Estado</Label>
                <Input
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  maxLength={2}
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Observações</Label>
              <Input
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditModalOpen(false)} className="border-gray-600">
                Cancelar
              </Button>
              <Button onClick={handleUpdateCartorio} className="bg-blue-600 hover:bg-blue-700">
                <Edit className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modais Auxiliares */}
      {selectedCartorio && (
        <>
          <CartorioUserManager
            cartorioId={selectedCartorio.id}
            cartorioName={selectedCartorio.nome}
            isOpen={userManagerOpen}
            onClose={() => {
              setUserManagerOpen(false);
              setSelectedCartorio(null);
            }}
          />

          <CartorioPermissionsManager
            cartorio={selectedCartorio}
            isOpen={permissionsManagerOpen}
            onClose={() => {
              setPermissionsManagerOpen(false);
              setSelectedCartorio(null);
            }}
            onUpdate={() => refetch()}
          />

          <EditTokenModal
            cartorio={selectedCartorio}
            isOpen={tokenModalOpen}
            onClose={() => {
              setTokenModalOpen(false);
              setSelectedCartorio(null);
            }}
            onUpdate={() => refetch()}
          />
        </>
      )}
    </>
  );
};
