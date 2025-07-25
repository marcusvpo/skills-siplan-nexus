import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, BookOpen, CheckCircle, Loader2, ArrowLeft, User, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
// Importa useAuth da versão FIXA
import { useAuth } from '@/contexts/AuthContextFixed'; 
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

      // Usar edge function para evitar problemas de RLS
      const { data: cartoriosResponse, error: cartoriosError } = await supabase.functions.invoke('get-cartorios-admin', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (cartoriosError) throw cartoriosError;
      const cartoriosData = cartoriosResponse?.data || [];

      // Processar dados para contar usuários
      const cartoriosProcessados = cartoriosData.map(cartorio => ({
        id: cartorio.id,
        nome: cartorio.nome,
        cidade: cartorio.cidade || '',
        estado: cartorio.estado || '',
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

      // Usar edge function para buscar dados do cartório e usuários
      const { data: cartoriosResponse, error: cartoriosError } = await supabase.functions.invoke('get-cartorios-admin', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (cartoriosError) throw cartoriosError;
      
      const cartorioData = cartoriosResponse?.data?.find((c: any) => c.id === cartorioId);
      if (!cartorioData) throw new Error('Cartório não encontrado');

      const usuariosData = cartorioData.cartorio_usuarios || [];

      setCartorioDetalhado({
        id: cartorioData.id,
        nome: cartorioData.nome,
        cidade: cartorioData.cidade || '',
        estado: cartorioData.estado || '',
        usuarios: usuariosData.map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          is_active: u.is_active,
          cartorio_id: cartorioId
        }))
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

      // Buscar dados do usuário a partir do cartório detalhado que já temos
      const usuarioData = cartorioDetalhado?.usuarios.find(u => u.id === usuarioId);
      if (!usuarioData) throw new Error('Usuário não encontrado');

      // Buscar progresso real do usuário a partir da tabela user_video_progress
      const { data: userVideoProgress, error: userProgressError } = await supabase
        .from('user_video_progress')
        .select(`
          video_aula_id,
          completed,
          video_aulas!inner(
            id,
            titulo,
            produto_id,
            produtos!inner(
              id,
              nome,
              sistemas!inner(
                id,
                nome
              )
            )
          )
        `)
        .eq('user_id', usuarioId)
        .eq('completed', true);

      if (userProgressError) {
        console.error('Erro ao buscar progresso do usuário:', userProgressError);
        throw userProgressError;
      }

      // Também buscar informações sobre produtos disponíveis para o cartório
      const { data: produtosDisponiveis, error: produtosError } = await supabase
        .from('produtos')
        .select(`
          id,
          nome,
          sistemas!inner(
            id,
            nome
          ),
          video_aulas(id)
        `);

      if (produtosError) {
        console.error('Erro ao buscar produtos disponíveis:', produtosError);
        throw produtosError;
      }


      // Processar progresso por produto
      const progressoPorProduto = new Map();

      // Contar aulas concluídas por produto
      userVideoProgress?.forEach(progress => {
        const videoAula = progress.video_aulas;
        if (videoAula && videoAula.produtos) {
          const produto = videoAula.produtos;
          const produtoId = produto.id;
          
          if (!progressoPorProduto.has(produtoId)) {
            progressoPorProduto.set(produtoId, {
              id: produtoId,
              nome: produto.nome,
              sistema_nome: produto.sistemas?.nome || 'Sistema',
              aulas_concluidas: 0,
              total_aulas: 0
            });
          }
          
          const progressoAtual = progressoPorProduto.get(produtoId);
          progressoAtual.aulas_concluidas += 1;
        }
      });

      // Adicionar informações sobre total de aulas por produto
      produtosDisponiveis?.forEach(produto => {
        const totalAulas = produto.video_aulas?.length || 0;
        
        if (progressoPorProduto.has(produto.id)) {
          const progressoAtual = progressoPorProduto.get(produto.id);
          progressoAtual.total_aulas = totalAulas;
          progressoAtual.percentual = totalAulas > 0 ? Math.round((progressoAtual.aulas_concluidas / totalAulas) * 100) : 0;
        } else {
          // Produto sem progresso
          progressoPorProduto.set(produto.id, {
            id: produto.id,
            nome: produto.nome,
            sistema_nome: produto.sistemas?.nome || 'Sistema',
            aulas_concluidas: 0,
            total_aulas: totalAulas,
            percentual: 0
          });
        }
      });

      const produtos = Array.from(progressoPorProduto.values());

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
                                 <div className="flex items-center space-x-2">
                                   <Badge 
                                     variant={produto.percentual === 100 ? "default" : "secondary"}
                                     className="text-xs min-w-[50px]"
                                   >
                                     {produto.percentual}%
                                   </Badge>
                                   {produto.percentual === 100 && (
                                     <div className="bg-green-600/90 text-green-50 px-2 py-1 rounded-full text-xs font-medium flex items-center shadow-lg">
                                       <CheckCircle className="h-3 w-3 mr-1" />
                                       Concluído
                                     </div>
                                   )}
                                 </div>
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
                    <div>
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