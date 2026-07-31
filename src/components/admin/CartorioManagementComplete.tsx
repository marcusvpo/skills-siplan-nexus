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
import { CreateCartorioWizard } from './CreateCartorioWizard';
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
      <Card className="bg-card/70 backdrop-blur-md border-border/50">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <span className="text-foreground">Carregando cartórios...</span>
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
        <Card className="bg-card/70 backdrop-blur-md border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Building className="h-5 w-5" />
                </span>
                Cartórios Cadastrados ({cartorios?.length || 0})
              </CardTitle>
              <Button
                onClick={() => setCreateModalOpen(true)}
                variant="glow"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Cartório
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-5 space-y-3 rounded-xl border border-border/50 bg-card/70 backdrop-blur-md p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, cidade, usuário ou token (ignora acentos)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-card/70 border-border/50 text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full border-border/50 bg-card/70 text-foreground sm:w-[190px]">
                      <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
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
                    <SelectTrigger className="w-full border-border/50 bg-card/70 text-foreground sm:w-[180px]">
                      <Key className="mr-2 h-4 w-4 text-muted-foreground" />
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
                    <SelectTrigger className="w-full border-border/50 bg-card/70 text-foreground sm:w-[210px]">
                      <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
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
                <Badge variant="outline" className="border-border/50 text-muted-foreground">
                  {filteredCartorios.length} de {cartorios?.length || 0} cartório
                  {(cartorios?.length || 0) === 1 ? '' : 's'}
                </Badge>
                {hasActiveFilters && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
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
                    className={`bg-card/70 backdrop-blur-md border border-border/50 hover:border-primary/60 transition-colors rounded-xl ${
                      isExpanded ? 'col-span-full border-primary/50 shadow-lg shadow-primary/20' : ''
                    }`}
                  >
                    <CardContent className={isExpanded ? 'p-6' : 'p-4'}>
                      <button
                        type="button"
                        onClick={() => setExpandedCartorioId(isExpanded ? null : cartorio.id)}
                        className="flex w-full items-center justify-between gap-4"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
                          <div className="min-w-0">
                            <p className="truncate text-left text-sm font-semibold text-foreground">{cartorio.nome}</p>
                            {cartorio.cidade && cartorio.estado && (
                              <p className="truncate text-left text-xs text-muted-foreground">
                                {cartorio.cidade} - {cartorio.estado}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <CartorioStatusIndicator
                            lastActivity={sessions.get(cartorio.id)?.last_activity || null}
                          />
                          {cartorio.acessos_cartorio?.[0]?.data_expiracao && (
                            <span className="hidden whitespace-nowrap text-xs text-muted-foreground xl:inline-flex">
                              Expira em {new Date(cartorio.acessos_cartorio[0].data_expiracao).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-6 space-y-6 border-t border-border/50 pt-6">
                          <div className="grid gap-4 lg:grid-cols-3">
                            {/* Bloco: credenciais de acesso */}
                            <div className="rounded-lg border border-border/50 bg-card/70 backdrop-blur-md p-4 lg:col-span-2">
                              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Credenciais de acesso
                              </p>
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="w-32 shrink-0 text-xs text-muted-foreground">Usuário</span>
                                  <code className="flex-1 min-w-0 truncate rounded bg-muted/50 px-3 py-1.5 font-mono text-xs text-foreground">
                                    {getUsuario(cartorio)}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(getUsuario(cartorio), 'Usuário copiado.')}
                                    className="h-8 w-8 shrink-0 border-border/50 p-0 text-muted-foreground"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="w-32 shrink-0 text-xs text-muted-foreground">Token do Cartório</span>
                                  <code className="flex-1 min-w-0 truncate rounded bg-muted/50 px-3 py-1.5 font-mono text-xs text-foreground">
                                    {getToken(cartorio) || 'Sem token'}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!getToken(cartorio)}
                                    onClick={() => copyToClipboard(getToken(cartorio), 'Token copiado para a área de transferência.')}
                                    className="h-8 w-8 shrink-0 border-border/50 p-0 text-muted-foreground"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <Button
                                  size="sm"
                                  disabled={!getToken(cartorio)}
                                  onClick={() => handleCopyModeloAcesso(cartorio)}
                                  variant="glow"
                                  className="w-full sm:w-auto"
                                >
                                  <ClipboardCheck className="mr-2 h-4 w-4" />
                                  Copiar Modelo Acesso
                                </Button>
                              </div>
                            </div>

                            {/* Bloco: detalhes */}
                            <div className="rounded-lg border border-border/50 bg-card/70 backdrop-blur-md p-4">
                              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Detalhes
                              </p>
                              <dl className="space-y-2 text-xs">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  <span className="truncate">
                                    {cartorio.cidade ? `${cartorio.cidade} - ${cartorio.estado || ''}` : 'Cidade não informada'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  <span>
                                    {cartorio.acessos_cartorio?.[0]?.data_expiracao
                                      ? `Expira em ${new Date(cartorio.acessos_cartorio[0].data_expiracao).toLocaleDateString('pt-BR')}`
                                      : 'Sem data de expiração'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  <span>
                                    {getLastActivity(cartorio)
                                      ? `Último acesso: ${getLastActivity(cartorio)!.toLocaleString('pt-BR')}`
                                      : 'Nunca acessou'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Key className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  <span>{cartorio.acessos_cartorio?.length || 0} token(s) cadastrado(s)</span>
                                </div>
                              </dl>
                              {cartorio.observacoes && (
                                <p className="mt-3 border-t border-border/50 pt-3 text-xs leading-relaxed text-muted-foreground">
                                  {cartorio.observacoes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleOpenUserManager(cartorio)}
                                className="bg-primary/15 text-primary hover:bg-primary/25"
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Usuários
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleOpenPermissions(cartorio)}
                                className="bg-accent text-accent-foreground hover:bg-accent/80"
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Permissões
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleOpenTokenModal(cartorio)}
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              >
                                <Key className="mr-2 h-4 w-4" />
                                Token
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditModal(cartorio)}
                                className="border-border/50 text-muted-foreground"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteCartorio(cartorio)}
                                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {filteredCartorios.length === 0 && (
                <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                  {'Nenhum cartório encontrado' + (searchTerm ? ' para "' + searchTerm + '"' : '') + '.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateCartorioWizard
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => refetch()}
      />

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-card/90 backdrop-blur-md border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle>Editar Cartório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Nome do Cartório *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="bg-muted/50 border-border/50 text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className="bg-muted/50 border-border/50 text-foreground"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Estado</Label>
                <Input
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="bg-muted/50 border-border/50 text-foreground"
                  maxLength={2}
                />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Observações</Label>
              <Input
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="bg-muted/50 border-border/50 text-foreground"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditModalOpen(false)} className="border-border/50">
                Cancelar
              </Button>
              <Button onClick={handleUpdateCartorio} variant="glow">
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
