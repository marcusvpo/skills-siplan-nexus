import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Building2, 
  Plus, 
  Key, 
  Calendar, 
  Mail, 
  MapPin,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  XCircle,
  Users,
  AlertCircle,
  RefreshCw,
  Edit2,
  Settings
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { useCreateCartorio } from '@/hooks/useSupabaseDataRefactored';
import { useCartoriosAdmin } from '@/hooks/useCartoriosAdmin';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/hooks/use-toast';
import { CartorioUserManager } from './CartorioUserManager';
import { CartorioEditor } from './CartorioEditor';

const CartorioManagerAudited: React.FC = () => {
  const [isNewCartorioOpen, setIsNewCartorioOpen] = useState(false);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [selectedCartorioForUsers, setSelectedCartorioForUsers] = useState<any>(null);
  const [selectedCartorioForEdit, setSelectedCartorioForEdit] = useState<any>(null);
  const [newCartorio, setNewCartorio] = useState({
    nome: '',
    cidade: '',
    estado: 'SP',
    observacoes: '',
    email_contato: '',
    data_expiracao: ''
  });

  const { isAdmin, isLoading: authLoading, error: authError } = useAdminAuth();
  const { data: cartorios = [], isLoading, error, refetch } = useCartoriosAdmin();
  const createCartorioMutation = useCreateCartorio();

  React.useEffect(() => {
    logger.info('🏢 [CartorioManagerAudited] Component mounted', { 
      cartoriosCount: cartorios.length,
      isLoading,
      hasError: !!error,
      isAdmin,
      authLoading
    });
  }, [cartorios.length, isLoading, error, isAdmin, authLoading]);

  React.useEffect(() => {
    if (error) {
      logger.error('❌ [CartorioManagerAudited] Error loading cartorios:', error);
      toast({
        title: "Erro ao carregar cartórios",
        description: "Não foi possível carregar a lista de cartórios. Verifique as permissões administrativas.",
        variant: "destructive",
      });
    }
  }, [error]);

  React.useEffect(() => {
    if (authError) {
      logger.error('❌ [CartorioManagerAudited] Auth error:', { error: authError });
      toast({
        title: "Erro de autenticação",
        description: authError,
        variant: "destructive",
      });
    }
  }, [authError]);

  const validateCartorioData = () => {
    const errors: string[] = [];
    
    if (!newCartorio.nome.trim()) {
      errors.push('Nome do cartório é obrigatório');
    }
    
    if (!newCartorio.email_contato.trim()) {
      errors.push('Email de contato é obrigatório');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCartorio.email_contato)) {
      errors.push('Email de contato deve ter formato válido');
    }
    
    if (!newCartorio.data_expiracao) {
      errors.push('Data de expiração é obrigatória');
    } else {
      const expirationDate = new Date(newCartorio.data_expiracao);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expirationDate <= today) {
        errors.push('Data de expiração deve ser futura');
      }
    }
    
    return errors;
  };

  const handleCreateCartorio = async () => {
    const validationErrors = validateCartorioData();
    
    if (validationErrors.length > 0) {
      toast({
        title: "Dados inválidos",
        description: validationErrors.join('. '),
        variant: "destructive",
      });
      return;
    }

    logger.info('🏢 [CartorioManagerAudited] Creating new cartorio:', { 
      nome: newCartorio.nome,
      email: newCartorio.email_contato 
    });

    try {
      const result = await createCartorioMutation.mutateAsync(newCartorio);
      
      logger.info('✅ [CartorioManagerAudited] Cartorio created successfully:', { 
        id: result.cartorio.id,
        token: result.login_token
      });

      toast({
        title: "Cartório criado com sucesso!",
        description: `"${newCartorio.nome}" foi criado. Token: ${result.login_token}`,
        duration: 10000, // 10 segundos para o usuário copiar o token
      });

      setNewCartorio({
        nome: '',
        cidade: '',
        estado: 'SP',
        observacoes: '',
        email_contato: '',
        data_expiracao: ''
      });
      setIsNewCartorioOpen(false);
      refetch();
    } catch (error) {
      logger.error('❌ [CartorioManagerAudited] Error creating cartorio:', error);
      
      let errorMessage = 'Não foi possível criar o cartório. Tente novamente.';
      
      if (error instanceof Error) {
        if (error.message.includes('duplicate key value')) {
          errorMessage = 'Já existe um cartório com este nome.';
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = 'Dados inválidos fornecidos.';
        } else if (error.message.includes('permission denied')) {
          errorMessage = 'Sem permissão para criar cartório.';
        } else {
          errorMessage = `Erro: ${error.message}`;
        }
      }
      
      toast({
        title: "Erro ao criar cartório",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const toggleTokenVisibility = (tokenId: string) => {
    setShowTokens(prev => ({
      ...prev,
      [tokenId]: !prev[tokenId]
    }));
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({
      title: "Token copiado",
      description: "O token foi copiado para a área de transferência.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isTokenExpired = (expirationDate: string) => {
    return new Date(expirationDate) < new Date();
  };

  const isTokenExpiringSoon = (expirationDate: string) => {
    const expiration = new Date(expirationDate);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-400">
            {authLoading ? 'Verificando permissões...' : 'Carregando cartórios...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Acesso negado</h3>
          <p className="text-gray-400 text-center mb-4">
            Você precisa ter permissões administrativas para acessar esta seção.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Erro ao carregar dados</h3>
          <p className="text-gray-400 text-center mb-4">
            Não foi possível carregar os cartórios. Verifique sua conexão e permissões.
          </p>
          <Button
            onClick={() => refetch()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de criar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciar Cartórios</h2>
          <p className="text-gray-400">Gerencie cartórios e seus acessos à plataforma</p>
        </div>
        <Dialog open={isNewCartorioOpen} onOpenChange={setIsNewCartorioOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cartório
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-600 text-white">
            <DialogHeader>
              <DialogTitle>Criar Novo Cartório</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Cartório *</Label>
                <Input
                  id="nome"
                  value={newCartorio.nome}
                  onChange={(e) => setNewCartorio(prev => ({ ...prev, nome: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Ex: 1º Cartório de Registro de Imóveis"
                  disabled={createCartorioMutation.isPending}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={newCartorio.cidade}
                    onChange={(e) => setNewCartorio(prev => ({ ...prev, cidade: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="São Paulo"
                    disabled={createCartorioMutation.isPending}
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={newCartorio.estado}
                    onChange={(e) => setNewCartorio(prev => ({ ...prev, estado: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="SP"
                    disabled={createCartorioMutation.isPending}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email_contato">Email de Contato *</Label>
                <Input
                  id="email_contato"
                  type="email"
                  value={newCartorio.email_contato}
                  onChange={(e) => setNewCartorio(prev => ({ ...prev, email_contato: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="contato@cartorio.com.br"
                  disabled={createCartorioMutation.isPending}
                />
              </div>

              <div>
                <Label htmlFor="data_expiracao">Data de Expiração do Acesso *</Label>
                <Input
                  id="data_expiracao"
                  type="date"
                  value={newCartorio.data_expiracao}
                  onChange={(e) => setNewCartorio(prev => ({ ...prev, data_expiracao: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  disabled={createCartorioMutation.isPending}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={newCartorio.observacoes}
                  onChange={(e) => setNewCartorio(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Observações sobre o cartório..."
                  disabled={createCartorioMutation.isPending}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsNewCartorioOpen(false)}
                  className="border-gray-600 text-gray-300"
                  disabled={createCartorioMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateCartorio}
                  disabled={createCartorioMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {createCartorioMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Criando...</span>
                    </div>
                  ) : (
                    'Criar Cartório'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de cartórios */}
      <div className="grid grid-cols-1 gap-6">
        {cartorios.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-600">
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Building2 className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum cartório cadastrado</h3>
              <p className="text-gray-400 text-center mb-4">
                Crie o primeiro cartório para começar a gerenciar os acessos à plataforma.
              </p>
              <Button
                onClick={() => setIsNewCartorioOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Cartório
              </Button>
            </CardContent>
          </Card>
        ) : (
          cartorios.map((cartorio) => (
            <Card key={cartorio.id} className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    {cartorio.nome}
                    {cartorio.is_active ? (
                      <Badge variant="secondary" className="ml-2 bg-green-600 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2 bg-red-600 text-white">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inativo
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {cartorio.acessos_cartorio?.length || 0} acessos
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCartorioForEdit(cartorio)}
                      className="border-blue-600 text-blue-400 hover:bg-blue-700/20"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCartorioForUsers(cartorio)}
                      className="border-green-600 text-green-400 hover:bg-green-700/20"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Usuários
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Informações do cartório */}
                  <div className="space-y-3">
                    <h4 className="text-white font-medium flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Informações
                    </h4>
                    <div className="space-y-2 text-sm">
                      {cartorio.cidade && cartorio.estado && (
                        <div className="flex items-center text-gray-300">
                          <span className="font-medium">Localização:</span>
                          <span className="ml-2">{cartorio.cidade}, {cartorio.estado}</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-300">
                        <span className="font-medium">Cadastrado em:</span>
                        <span className="ml-2">{formatDate(cartorio.data_cadastro)}</span>
                      </div>
                      {cartorio.observacoes && (
                        <div className="text-gray-300">
                          <span className="font-medium">Observações:</span>
                          <p className="mt-1 text-gray-400">{cartorio.observacoes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tokens de acesso */}
                  <div className="space-y-3">
                    <h4 className="text-white font-medium flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      Tokens de Acesso
                    </h4>
                    <div className="space-y-3">
                      {cartorio.acessos_cartorio?.length === 0 ? (
                        <p className="text-gray-400 text-sm">Nenhum token de acesso encontrado</p>
                      ) : (
                        cartorio.acessos_cartorio?.map((acesso) => (
                          <div
                            key={acesso.id}
                            className="p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {acesso.ativo ? (
                                  <Badge variant="secondary" className="bg-green-600 text-white">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Ativo
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-red-600 text-white">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inativo
                                  </Badge>
                                )}
                                {isTokenExpired(acesso.data_expiracao) && (
                                  <Badge variant="destructive">Expirado</Badge>
                                )}
                                {isTokenExpiringSoon(acesso.data_expiracao) && (
                                  <Badge variant="secondary" className="bg-yellow-600 text-white">
                                    Expira em breve
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-300">Token:</span>
                                <div className="flex items-center space-x-2">
                                  <code className="bg-gray-600 px-2 py-1 rounded text-xs text-white">
                                    {showTokens[acesso.id] 
                                      ? acesso.login_token 
                                      : '•'.repeat(20)
                                    }
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleTokenVisibility(acesso.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    {showTokens[acesso.id] ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToken(acesso.login_token)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex items-center text-gray-300">
                                <Mail className="h-3 w-3 mr-2" />
                                <span>{acesso.email_contato}</span>
                              </div>
                              
                              <div className="flex items-center text-gray-300">
                                <Calendar className="h-3 w-3 mr-2" />
                                <span>Expira em: {formatDate(acesso.data_expiracao)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de gerenciamento de usuários */}
      {selectedCartorioForUsers && (
        <CartorioUserManager
          cartorioId={selectedCartorioForUsers.id}
          cartorioName={selectedCartorioForUsers.nome}
          isOpen={!!selectedCartorioForUsers}
          onClose={() => setSelectedCartorioForUsers(null)}
        />
      )}

      {/* Modal de edição de cartório */}
      {selectedCartorioForEdit && (
        <CartorioEditor
          cartorio={selectedCartorioForEdit}
          isOpen={!!selectedCartorioForEdit}
          onClose={() => setSelectedCartorioForEdit(null)}
          onUpdate={() => {
            refetch();
            setSelectedCartorioForEdit(null);
          }}
        />
      )}
    </div>
  );
};

export default CartorioManagerAudited;
