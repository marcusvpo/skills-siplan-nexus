import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, BookOpen, CheckCircle, Loader2, ArrowLeft, User, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface CartorioBasico {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  total_usuarios: number;
}

interface UsuarioCartorio {
  id: string;
  username: string;
  email?: string;
  is_active: boolean;
  cartorio_id: string;
}

interface UsuarioProgresso {
  id: string;
  username: string;
  email?: string;
  is_active: boolean;
  produtos: {
    id: string;
    nome: string;
    sistema_nome: string;
    total_aulas: number;
    aulas_concluidas: number;
    percentual: number;
  }[];
  progresso_geral: {
    total_aulas: number;
    aulas_concluidas: number;
    percentual: number;
  };
}

interface CartorioDetalhado {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  usuarios: UsuarioCartorio[];
}

export const UserProgressViewFinal: React.FC = () => {
  const { isAdmin } = useAuth();
  const [cartorios, setCartorios] = useState<CartorioBasico[]>([]);
  const [cartorioDetalhado, setCartorioDetalhado] = useState<CartorioDetalhado | null>(null);
  const [usuarioProgresso, setUsuarioProgresso] = useState<UsuarioProgresso | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetalhes, setIsLoadingDetalhes] = useState(false);
  const [isLoadingProgresso, setIsLoadingProgresso] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadCartorios();
    }
  }, [isAdmin]);

  const loadCartorios = async () => {
    try {
      setIsLoading(true);

      // Buscar cartórios com contagem de usuários
      const { data: cartoriosData, error: cartoriosError } = await supabase
        .from('cartorios')
        .select(`
          id, nome, cidade, estado,
          cartorio_usuarios!inner (id)
        `)
        .eq('is_active', true)
        .order('nome');

      if (cartoriosError) throw cartoriosError;

      // Processar dados para contar usuários
      const cartoriosProcessados = cartoriosData.map(cartorio => ({
        id: cartorio.id,
        nome: cartorio.nome,
        cidade: cartorio.cidade,
        estado: cartorio.estado,
        total_usuarios: cartorio.cartorio_usuarios?.length || 0
      }));

      setCartorios(cartoriosProcessados);
    } catch (error) {
      console.error('❌ [UserProgressViewFinal] Erro ao carregar cartórios:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar a lista de cartórios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCartorioUsuarios = async (cartorioId: string) => {
    try {
      setIsLoadingDetalhes(true);

      // Buscar dados básicos do cartório
      const { data: cartorioData, error: cartorioError } = await supabase
        .from('cartorios')
        .select('id, nome, cidade, estado')
        .eq('id', cartorioId)
        .single();

      if (cartorioError) throw cartorioError;

      // Buscar usuários do cartório
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('cartorio_usuarios')
        .select('id, username, email, is_active, cartorio_id')
        .eq('cartorio_id', cartorioId)
        .eq('is_active', true)
        .order('username');

      if (usuariosError) throw usuariosError;

      setCartorioDetalhado({
        id: cartorioData.id,
        nome: cartorioData.nome,
        cidade: cartorioData.cidade,
        estado: cartorioData.estado,
        usuarios: usuariosData || []
      });

    } catch (error) {
      console.error('❌ [UserProgressViewFinal] Erro ao carregar usuários:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar os usuários do cartório.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetalhes(false);
    }
  };

  const loadUsuarioProgresso = async (usuarioId: string, cartorioId: string) => {
    try {
      setIsLoadingProgresso(true);

      // Buscar dados básicos do usuário
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('cartorio_usuarios')
        .select('id, username, email, is_active')
        .eq('id', usuarioId)
        .single();

      if (usuarioError) throw usuarioError;

      // Usar a nova função SQL que filtra por permissões
      const { data: progressData, error: progressError } = await supabase
        .rpc('get_user_progress_by_cartorio_with_permissions', { p_cartorio_id: cartorioId });

      if (progressError) {
        console.error('Erro ao buscar progresso:', progressError);
        throw progressError;
      }

      // Filtrar apenas os dados do usuário específico
      const userProgressData = progressData?.filter(row => row.user_id === usuarioId) || [];

      if (userProgressData.length === 0) {
        // Usuário não tem produtos liberados
        setUsuarioProgresso({
          id: usuarioData.id,
          username: usuarioData.username,
          email: usuarioData.email,
          is_active: usuarioData.is_active,
          produtos: [],
          progresso_geral: {
            total_aulas: 0,
            aulas_concluidas: 0,
            percentual: 0
          }
        });
        return;
      }

      // Processar dados do progresso
      const produtos = userProgressData.map(row => ({
        id: row.produto_id,
        nome: row.produto_nome,
        sistema_nome: row.sistema_nome,
        total_aulas: Number(row.total_aulas),
        aulas_concluidas: Number(row.aulas_concluidas),
        percentual: Number(row.percentual)
      }));

      // Calcular progresso geral
      const totalAulas = produtos.reduce((sum, produto) => sum + produto.total_aulas, 0);
      const aulasConcluidas = produtos.reduce((sum, produto) => sum + produto.aulas_concluidas, 0);
      const percentualGeral = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;

      setUsuarioProgresso({
        id: usuarioData.id,
        username: usuarioData.username,
        email: usuarioData.email,
        is_active: usuarioData.is_active,
        produtos,
        progresso_geral: {
          total_aulas: totalAulas,
          aulas_concluidas: aulasConcluidas,
          percentual: percentualGeral
        }
      });

    } catch (error) {
      console.error('❌ [UserProgressViewFinal] Erro ao carregar progresso:', error);
      toast({
        title: "Erro ao carregar progresso",
        description: "Não foi possível carregar o progresso do usuário.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProgresso(false);
    }
  };

  const voltarParaCartorios = () => {
    setCartorioDetalhado(null);
    setUsuarioProgresso(null);
  };

  const voltarParaUsuarios = () => {
    setUsuarioProgresso(null);
  };

  if (!isAdmin) {
    return (
      <Card className="gradient-card shadow-elevated border-gray-600/50">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">Acesso negado. Apenas administradores podem ver esta página.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="gradient-card shadow-elevated border-gray-600/50">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-white text-enhanced">Carregando dados dos cartórios...</p>
        </CardContent>
      </Card>
    );
  }

  // Visualização do progresso individual do usuário
  if (usuarioProgresso) {
    return (
      <div className="space-y-6">
        <Card className="gradient-card shadow-elevated border-gray-600/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={voltarParaUsuarios}
                  className="mr-4 text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <CardTitle className="text-white flex items-center text-enhanced">
                  <div className="p-2 bg-gradient-to-br from-green-600 to-green-700 rounded-lg mr-3 shadow-modern">
                    <UserCheck className="h-5 w-5 text-white" />
                  </div>
                  Progresso Individual - {usuarioProgresso.username}
                </CardTitle>
              </div>
            </div>
            <p className="text-sm text-gray-400 ml-16">
              {cartorioDetalhado?.nome} - {cartorioDetalhado?.cidade}, {cartorioDetalhado?.estado}
            </p>
          </CardHeader>
          <CardContent>
            {isLoadingProgresso ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
                <p className="text-white text-enhanced">Carregando progresso do usuário...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Resumo geral */}
                <Card className="glass-effect border-gray-600/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white text-enhanced">{usuarioProgresso.username}</h3>
                        {usuarioProgresso.email && (
                          <p className="text-sm text-gray-400">{usuarioProgresso.email}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {usuarioProgresso.progresso_geral.aulas_concluidas}/{usuarioProgresso.progresso_geral.total_aulas} aulas
                        </p>
                        <Badge variant={usuarioProgresso.progresso_geral.percentual >= 80 ? "default" : "secondary"}>
                          {usuarioProgresso.progresso_geral.percentual}% concluído
                        </Badge>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Progress value={usuarioProgresso.progresso_geral.percentual} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Produtos liberados */}
                <div className="space-y-4">
                  <h4 className="font-medium text-white text-enhanced flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-blue-400" />
                    Produtos Liberados para este Cartório
                  </h4>
                  
                  {usuarioProgresso.produtos.length > 0 ? (
                    <div className="grid gap-3">
                      {usuarioProgresso.produtos.map((produto) => (
                        <Card key={produto.id} className="glass-effect border-gray-600/50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{produto.nome}</p>
                                <p className="text-xs text-gray-400">
                                  {produto.sistema_nome} • {produto.aulas_concluidas} de {produto.total_aulas} aulas
                                </p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="w-24">
                                  <Progress value={produto.percentual} className="h-2" />
                                </div>
                                <Badge 
                                  variant={produto.percentual === 100 ? "default" : "secondary"}
                                  className="text-xs min-w-[50px]"
                                >
                                  {produto.percentual}%
                                </Badge>
                                {produto.percentual === 100 && (
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="glass-effect border-gray-600/50">
                      <CardContent className="p-6 text-center">
                        <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-400">Nenhum produto liberado para este cartório</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Configure as permissões do cartório para liberar produtos específicos
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Visualização de usuários do cartório
  if (cartorioDetalhado) {
    return (
      <div className="space-y-6">
        <Card className="gradient-card shadow-elevated border-gray-600/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={voltarParaCartorios}
                  className="mr-4 text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <CardTitle className="text-white flex items-center text-enhanced">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg mr-3 shadow-modern">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Usuários do Cartório - {cartorioDetalhado.nome}
                </CardTitle>
              </div>
            </div>
            <p className="text-sm text-gray-400 ml-16">
              {cartorioDetalhado.cidade}, {cartorioDetalhado.estado}
            </p>
          </CardHeader>
          <CardContent>
            {isLoadingDetalhes ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
                <p className="text-white text-enhanced">Carregando usuários...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {cartorioDetalhado.usuarios.map((usuario) => (
                  <Card 
                    key={usuario.id} 
                    className="glass-effect border-gray-600/50 hover:border-blue-500/50 transition-all duration-300"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white text-enhanced">{usuario.username}</h3>
                          {usuario.email && (
                            <p className="text-sm text-gray-400">{usuario.email}</p>
                          )}
                          <div className="flex items-center mt-2">
                            <User className="h-4 w-4 text-green-400 mr-2" />
                            <span className="text-sm text-gray-300">
                              {usuario.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadUsuarioProgresso(usuario.id, cartorioDetalhado.id)}
                            className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Ver Progresso
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {cartorioDetalhado.usuarios.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Nenhum usuário ativo encontrado neste cartório</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Visualização principal - lista de cartórios
  return (
    <div className="space-y-6">
      <Card className="gradient-card shadow-elevated border-gray-600/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-enhanced">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg mr-3 shadow-modern">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            Progresso dos Usuários por Cartório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {cartorios.map((cartorio) => (
              <Card 
                key={cartorio.id} 
                className="glass-effect border-gray-600/50 hover:border-red-500/50 transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white text-enhanced">{cartorio.nome}</h3>
                      <p className="text-sm text-gray-400">
                        {cartorio.cidade}, {cartorio.estado}
                      </p>
                      <div className="flex items-center mt-2">
                        <Users className="h-4 w-4 text-blue-400 mr-2" />
                        <span className="text-sm text-gray-300">
                          {cartorio.total_usuarios} usuário(s) cadastrado(s)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadCartorioUsuarios(cartorio.id)}
                        className="border-red-600 text-red-400 hover:bg-red-600/20"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Ver usuários
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {cartorios.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum cartório encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};