import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building,
  Users,
  Shield,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
  Copy,
  ClipboardCheck,
  AlertCircle,
  PartyPopper,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateCartorioWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface NewUser {
  username: string;
  email: string;
  is_active: boolean;
  active_trilha_id: string;
}

const STEPS = [
  { id: 1, label: 'Cartório', icon: Building },
  { id: 2, label: 'Usuários', icon: Users },
  { id: 3, label: 'Acesso ao conteúdo', icon: Shield },
];

export const CreateCartorioWizard: React.FC<CreateCartorioWizardProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ nome: string; token: string; usuario: string } | null>(null);

  // Etapa 1
  const [form, setForm] = useState({
    nome: '',
    cidade: '',
    estado: 'SP',
    observacoes: '',
    data_expiracao: '',
  });

  // Etapa 2
  const [users, setUsers] = useState<NewUser[]>([]);
  const [userDraft, setUserDraft] = useState<NewUser>({
    username: '',
    email: '',
    is_active: true,
    active_trilha_id: '',
  });
  const [trilhas, setTrilhas] = useState<any[]>([]);

  // Etapa 3
  const [sistemas, setSistemas] = useState<any[]>([]);
  const [loadingSistemas, setLoadingSistemas] = useState(false);
  const [selecoes, setSelecoes] = useState<Set<string>>(new Set());

  const resetAll = () => {
    setStep(1);
    setResult(null);
    setForm({ nome: '', cidade: '', estado: 'SP', observacoes: '', data_expiracao: '' });
    setUsers([]);
    setUserDraft({ username: '', email: '', is_active: true, active_trilha_id: '' });
    setSelecoes(new Set());
  };

  useEffect(() => {
    if (!isOpen) return;
    resetAll();

    const load = async () => {
      setLoadingSistemas(true);
      const [trilhasRes, sistemasRes] = await Promise.all([
        supabase.from('trilhas').select('id, nome').order('nome'),
        supabase.from('sistemas').select('*, produtos (*)').order('ordem'),
      ]);
      if (!trilhasRes.error) setTrilhas(trilhasRes.data || []);
      if (!sistemasRes.error) setSistemas(sistemasRes.data || []);
      setLoadingSistemas(false);
    };
    load();
  }, [isOpen]);

  const addUser = () => {
    const username = userDraft.username.trim();
    if (!username) {
      toast({
        title: 'Nome de usuário obrigatório',
        description: 'Digite um nome de usuário para adicionar.',
        variant: 'destructive',
      });
      return;
    }
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      toast({
        title: 'Usuário duplicado',
        description: 'Já existe um usuário com esse nome nesta lista.',
        variant: 'destructive',
      });
      return;
    }
    setUsers((prev) => [...prev, { ...userDraft, username }]);
    setUserDraft({ username: '', email: '', is_active: true, active_trilha_id: '' });
  };

  const toggleSistema = (sistemaId: string) => {
    const key = `sistema-${sistemaId}`;
    const sistema = sistemas.find((s) => s.id === sistemaId);
    const next = new Set(selecoes);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
      (sistema?.produtos || []).forEach((p: any) => next.delete(`produto-${p.id}`));
    }
    setSelecoes(next);
  };

  const toggleProduto = (produtoId: string, sistemaId: string) => {
    const key = `produto-${produtoId}`;
    const next = new Set(selecoes);
    if (next.has(key)) next.delete(key);
    else {
      next.add(key);
      next.delete(`sistema-${sistemaId}`);
    }
    setSelecoes(next);
  };

  const canAdvanceStep1 = form.nome.trim().length > 0 && !!form.data_expiracao;

  const goNext = () => {
    if (step === 1 && !canAdvanceStep1) {
      toast({
        title: 'Dados incompletos',
        description: 'Informe o nome do cartório e a data de expiração do acesso.',
        variant: 'destructive',
      });
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const handleFinish = async () => {
    if (!canAdvanceStep1) {
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    let cartorioId: string | null = null;

    try {
      const { data: cartorio, error: cartorioError } = await supabase
        .from('cartorios')
        .insert({
          nome: form.nome.trim(),
          cidade: form.cidade?.trim() || null,
          estado: form.estado?.trim() || 'SP',
          observacoes: form.observacoes?.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (cartorioError) throw cartorioError;
      cartorioId = cartorio.id;

      const timestamp = Date.now().toString();
      const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      const login_token = `CART${timestamp.slice(-8)}${randomNum}`;

      const { error: acessoError } = await supabase.from('acessos_cartorio').insert({
        login_token,
        cartorio_id: cartorio.id,
        data_expiracao: form.data_expiracao,
        ativo: true,
      });
      if (acessoError) throw acessoError;

      if (users.length > 0) {
        const { error: usersError } = await supabase.from('cartorio_usuarios').insert(
          users.map((u) => ({
            cartorio_id: cartorio.id,
            username: u.username.trim(),
            email: u.email?.trim() || null,
            is_active: u.is_active,
            active_trilha_id: u.active_trilha_id || null,
          }))
        );
        if (usersError) throw usersError;
      }

      const permissoes = Array.from(selecoes)
        .map((selection) => {
          const [tipo, ...idParts] = selection.split('-');
          const fullId = idParts.join('-');
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(fullId)) return null;
          return {
            cartorio_id: cartorio.id,
            sistema_id: tipo === 'sistema' ? fullId : null,
            produto_id: tipo === 'produto' ? fullId : null,
            ativo: true,
            nivel_acesso: 'completo',
          };
        })
        .filter(Boolean) as any[];

      if (permissoes.length > 0) {
        const { error: permError } = await supabase
          .from('cartorio_acesso_conteudo')
          .insert(permissoes);
        if (permError) throw permError;
      }

      setResult({
        nome: form.nome.trim(),
        token: login_token,
        usuario: users[0]?.username || form.nome.trim(),
      });
      onCreated();
    } catch (error: any) {
      // Rollback do cartório para não deixar registro parcial
      if (cartorioId) {
        await supabase.from('cartorios').delete().eq('id', cartorioId);
      }
      toast({
        title: 'Erro ao criar cartório',
        description: error?.message || 'Não foi possível concluir o cadastro.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copiado!', description: message });
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível acessar a área de transferência.',
        variant: 'destructive',
      });
    }
  };

  const resumoPermissoes = useMemo(() => {
    if (selecoes.size === 0) return 'Acesso a todo o conteúdo (nenhuma restrição)';
    const s = Array.from(selecoes).filter((k) => k.startsWith('sistema-')).length;
    const p = Array.from(selecoes).filter((k) => k.startsWith('produto-')).length;
    return `${s} sistema(s) completo(s) · ${p} produto(s) específico(s)`;
  }, [selecoes]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            {result ? 'Cartório criado com sucesso' : 'Criar Novo Cartório'}
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 text-center">
              <PartyPopper className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="text-lg font-semibold">{result.nome}</p>
              <p className="text-sm text-muted-foreground">
                Cartório, usuários e permissões cadastrados de uma só vez.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Usuário</p>
                  <p className="truncate font-medium">{result.usuario}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => copy(result.usuario, 'Usuário copiado.')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Token de acesso</p>
                  <p className="truncate font-mono text-sm">{result.token}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => copy(result.token, 'Token copiado.')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() =>
                  copy(
                    `https://skills.siplan.com.br/\n\nUsuário: ${result.usuario}\nToken de Acesso: ${result.token}`,
                    'Modelo de acesso copiado.'
                  )
                }
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Copiar Modelo Acesso
              </Button>
              <Button variant="outline" onClick={resetAll}>
                <Plus className="mr-2 h-4 w-4" />
                Criar outro
              </Button>
              <Button onClick={onClose}>
                <Check className="mr-2 h-4 w-4" />
                Concluir
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stepper */}
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const active = step === s.id;
                const done = step > s.id;
                return (
                  <React.Fragment key={s.id}>
                    <button
                      type="button"
                      onClick={() => (s.id < step ? setStep(s.id) : undefined)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        active
                          ? 'border-primary/60 bg-primary/15 text-foreground'
                          : done
                            ? 'border-border/60 bg-card/60 text-muted-foreground'
                            : 'border-border/40 bg-transparent text-muted-foreground'
                      }`}
                    >
                      {done ? <Check className="h-4 w-4 text-primary" /> : <Icon className="h-4 w-4" />}
                      <span className="hidden sm:inline">
                        {s.id}. {s.label}
                      </span>
                      <span className="sm:hidden">{s.id}</span>
                    </button>
                    {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border/60" />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Etapa 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Nome do Cartório *</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex.: 1º Cartório de Registro de Imóveis"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Label>Cidade</Label>
                    <Input
                      value={form.cidade}
                      onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input
                      value={form.estado}
                      maxLength={2}
                      onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Data de Expiração do Acesso *</Label>
                  <Input
                    type="date"
                    value={form.data_expiracao}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm({ ...form, data_expiracao: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    O token de login será gerado automaticamente ao concluir.
                  </p>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Input
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Etapa 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border/60 bg-card/50 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Nome de usuário</Label>
                      <Input
                        value={userDraft.username}
                        onChange={(e) => setUserDraft({ ...userDraft, username: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addUser()}
                        placeholder="ex.: escrevente.maria"
                      />
                    </div>
                    <div>
                      <Label>E-mail (opcional)</Label>
                      <Input
                        type="email"
                        value={userDraft.email}
                        onChange={(e) => setUserDraft({ ...userDraft, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Trilha inicial (opcional)</Label>
                      <Select
                        value={userDraft.active_trilha_id || 'none'}
                        onValueChange={(v) =>
                          setUserDraft({ ...userDraft, active_trilha_id: v === 'none' ? '' : v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Usuário comum" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Usuário comum (sem trilha)</SelectItem>
                          {trilhas.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={userDraft.is_active}
                          onCheckedChange={(v) => setUserDraft({ ...userDraft, is_active: v })}
                        />
                        <span className="text-sm text-muted-foreground">Ativo</span>
                      </div>
                      <Button onClick={addUser} variant="glow">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>

                {users.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                    Nenhum usuário adicionado ainda. Você pode concluir sem usuários e cadastrá-los depois.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map((u, idx) => (
                      <Card key={`${u.username}-${idx}`}>
                        <CardContent className="flex items-center justify-between gap-3 p-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{u.username}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {u.email || 'sem e-mail'}
                              {u.active_trilha_id
                                ? ` · ${trilhas.find((t) => t.id === u.active_trilha_id)?.nome || 'trilha'}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={u.is_active ? 'default' : 'secondary'}>
                              {u.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUsers(users.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Etapa 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/10 p-4 text-sm">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-primary" />
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Marque um <strong className="text-foreground">Sistema</strong> para liberar todos os produtos dele.</li>
                    <li>• Marque <strong className="text-foreground">Produtos</strong> para acesso granular.</li>
                    <li>• Sem nenhuma marcação, o cartório terá acesso a todo o conteúdo.</li>
                  </ul>
                </div>

                {loadingSistemas ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Carregando conteúdo...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sistemas.map((sistema) => {
                      const sistemaSelected = selecoes.has(`sistema-${sistema.id}`);
                      return (
                        <Card key={sistema.id}>
                          <CardContent className="space-y-3 p-4">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={sistemaSelected}
                                onCheckedChange={() => toggleSistema(sistema.id)}
                              />
                              <span className="font-medium">{sistema.nome}</span>
                              {sistemaSelected && (
                                <Badge variant="default">Acesso completo</Badge>
                              )}
                            </div>
                            {sistema.produtos?.length > 0 && (
                              <div className="ml-7 grid gap-2 sm:grid-cols-2">
                                {sistema.produtos.map((produto: any) => (
                                  <label
                                    key={produto.id}
                                    className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                                  >
                                    <Checkbox
                                      checked={sistemaSelected || selecoes.has(`produto-${produto.id}`)}
                                      disabled={sistemaSelected}
                                      onCheckedChange={() => toggleProduto(produto.id, sistema.id)}
                                    />
                                    {produto.nome}
                                  </label>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                <div className="rounded-lg border border-border/60 bg-card/50 p-4 text-sm">
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    Resumo do cadastro
                  </p>
                  <p className="font-medium">{form.nome || '—'}</p>
                  <p className="text-muted-foreground">
                    {users.length} usuário(s) · {resumoPermissoes}
                  </p>
                </div>
              </div>
            )}

            {/* Navegação */}
            <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
              <Button
                variant="outline"
                onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {step === 1 ? 'Cancelar' : 'Voltar'}
              </Button>

              {step < 3 ? (
                <Button onClick={goNext} variant="glow">
                  Continuar
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={isSubmitting} variant="glow">
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Criar cartório completo
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};