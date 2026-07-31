import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building, Plus, Edit, Trash2, Users, Key, Shield, Loader2, Search, ChevronRight, ChevronDown, Copy, ClipboardCheck, Filter, ArrowUpDown, X, MapPin, CalendarClock, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCartoriosWithAcessos } from '@/hooks/useSupabaseDataRefactored';
import { CartorioUserManager } from './CartorioUserManager';
import { CartorioPermissionsManager } from './CartorioPermissionsManager';
import { EditTokenModal } from './EditTokenModal';
import { CartorioStatusIndicator } from './CartorioStatusIndicator';
import { useCartorioSessions } from '@/hooks/useCartorioSessions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const CartorioManagementComplete: React.FC = () => {
  const { data: cartorios, isLoading, refetch } = useCartoriosWithAcessos();
  const sessions = useCartorioSessions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tokenFilter, setTokenFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
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

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copiado!', description: successMessage });
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível acessar a área de transferência.',
        variant: 'destructive',
      });
    }
  };

  const getToken = (cartorio: any) => cartorio.acessos_cartorio?.[0]?.login_token || '';

  const getUsuario = (cartorio: any) =>
    cartorio.cartorio_usuarios?.find((u: any) => u.is_active !== false)?.username ||
    cartorio.cartorio_usuarios?.[0]?.username ||
    cartorio.nome;

  const handleCopyModeloAcesso = (cartorio: any) => {
    const modelo = `https://skills.siplan.com.br/\n\nUsuário: ${getUsuario(cartorio)}\nToken de Acesso: ${getToken(cartorio)}`;
    copyToClipboard(modelo, 'Modelo de acesso copiado para a área de transferência.');
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

  // Normaliza texto removendo acentos para busca tolerante ("Olimpia" == "Olímpia")
  const normalize = (value: string) =>
    (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const getLastActivity = (cartorio: any): Date | null => {
    const raw = sessions.get(cartorio.id)?.last_activity;
    return raw ? new Date(raw) : null;
  };

  const minutesSince = (date: Date | null) =>
    date ? (Date.now() - date.getTime()) / 60000 : Number.POSITIVE_INFINITY;

  const isTokenExpired = (cartorio: any) => {
    const exp = cartorio.acessos_cartorio?.[0]?.data_expiracao;
    if (!exp) return false;
    return new Date(exp).getTime() < Date.now();
  };

  const filteredCartorios = (cartorios || [])
    .filter((cartorio: any) => {
      const term = normalize(searchTerm);
      if (term) {
        const haystack = [cartorio.nome, cartorio.cidade, cartorio.estado, getToken(cartorio), getUsuario(cartorio)]
          .map((v) => normalize(String(v ?? '')))
          .join(' ');
        if (!haystack.includes(term)) return false;
      }

      if (statusFilter !== 'all') {
        const mins = minutesSince(getLastActivity(cartorio));
        if (statusFilter === 'online' && mins > 2) return false;
        if (statusFilter === 'recent' && (mins <= 2 || mins > 60 * 24 * 5)) return false;
        if (statusFilter === 'inactive' && mins <= 60 * 24 * 5) return false;
        if (statusFilter === 'never' && Number.isFinite(mins)) return false;
      }

      if (tokenFilter === 'valid' && (!getToken(cartorio) || isTokenExpired(cartorio))) return false;
      if (tokenFilter === 'expired' && !isTokenExpired(cartorio)) return false;
      if (tokenFilter === 'none' && getToken(cartorio)) return false;

      return true;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'name') return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
      if (sortBy === 'city') return String(a.cidade || '').localeCompare(String(b.cidade || ''), 'pt-BR');
      if (sortBy === 'lastLogin') return minutesSince(getLastActivity(a)) - minutesSince(getLastActivity(b));
      if (sortBy === 'expiration') {
        const av = a.acessos_cartorio?.[0]?.data_expiracao;
        const bv = b.acessos_cartorio?.[0]?.data_expiracao;
        return new Date(av || '2999-01-01').getTime() - new Date(bv || '2999-01-01').getTime();
      }
      // recent (padrão): criados mais recentemente primeiro
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  const hasActiveFilters =
    !!searchTerm.trim() || statusFilter !== 'all' || tokenFilter !== 'all' || sortBy !== 'recent';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTokenFilter('all');
    setSortBy('recent');
  };

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
            <div className="mb-5 space-y-3 rounded-xl border border-gray-700/70 bg-gray-900/40 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, cidade, usuário ou token (ignora acentos)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-gray-900/60 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full border-gray-700 bg-gray-900/60 text-white sm:w-[190px]">
                      <Filter className="mr-2 h-4 w-4 text-gray-400" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="online">Online agora</SelectItem>
                      <SelectItem value="recent">Ativo (últimos 5 dias)</SelectItem>
                      <SelectItem value="inactive">Inativo (+5 dias)</SelectItem>
                      <SelectItem value="never">Nunca acessou</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={tokenFilter} onValueChange={setTokenFilter}>
                    <SelectTrigger className="w-full border-gray-700 bg-gray-900/60 text-white sm:w-[180px]">
                      <Key className="mr-2 h-4 w-4 text-gray-400" />
                      <SelectValue placeholder="Token" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tokens</SelectItem>
                      <SelectItem value="valid">Token válido</SelectItem>
                      <SelectItem value="expired">Token expirado</SelectItem>
                      <SelectItem value="none">Sem token</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full border-gray-700 bg-gray-900/60 text-white sm:w-[210px]">
                      <ArrowUpDown className="mr-2 h-4 w-4 text-gray-400" />
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Criados recentemente</SelectItem>
                      <SelectItem value="lastLogin">Último acesso</SelectItem>
                      <SelectItem value="expiration">Expiração mais próxima</SelectItem>
                      <SelectItem value="name">Nome (A-Z)</SelectItem>
                      <SelectItem value="city">Cidade (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-gray-700 text-gray-300">
                  {filteredCartorios.length} de {cartorios?.length || 0} cartório
                  {(cartorios?.length || 0) === 1 ? '' : 's'}
                </Badge>
                {hasActiveFilters && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Limpar filtros
                  </Button>
                )}
              </div>
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
                            lastActivity={sessions.get(cartorio.id)?.last_activity || null}
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
                            <div className="space-y-1">
                              <p className="text-xs text-gray-400">
                                Usuário: <span className="font-mono text-gray-200">{getUsuario(cartorio)}</span>
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Token do Cartório:</span>
                                <code className="rounded bg-gray-900/70 px-2 py-1 font-mono text-xs text-gray-100">
                                  {getToken(cartorio) || 'Sem token'}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!getToken(cartorio)}
                                  onClick={() => copyToClipboard(getToken(cartorio), 'Token copiado para a área de transferência.')}
                                  className="h-7 border-gray-600 px-2 text-gray-300"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">
                              Tokens: {cartorio.acessos_cartorio?.length || 0}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 md:justify-end">
                            <Button
                              size="sm"
                              disabled={!getToken(cartorio)}
                              onClick={() => handleCopyModeloAcesso(cartorio)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <ClipboardCheck className="mr-1 h-4 w-4" />
                              Copiar Modelo Acesso
                            </Button>
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
