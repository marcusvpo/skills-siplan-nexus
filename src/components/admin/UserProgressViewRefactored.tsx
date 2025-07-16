import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, BookOpen, CheckCircle, Loader2, ArrowLeft, User } from 'lucide-react';
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
  usuarios: UsuarioProgresso[];
}

export const UserProgressViewRefactored: React.FC = () => {
  const { isAdmin } = useAuth();
  const [cartorios, setCartorios] = useState<CartorioBasico[]>([]);
  const [cartorioDetalhado, setCartorioDetalhado] = useState<CartorioDetalhado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetalhes, setIsLoadingDetalhes] = useState(false);

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
      console.error('❌ [UserProgressViewRefactored] Erro ao carregar cartórios:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar a lista de cartórios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCartorioDetalhes = async (cartorioId: string) => {
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
        .select('id, username, email, is_active')
        .eq('cartorio_id', cartorioId)
        .eq('is_active', true)
        .order('username');

      if (usuariosError) throw usuariosError;

      // Buscar permissões do cartório para filtrar apenas produtos permitidos
      const { data: permissoes, error: permissoesError } = await supabase
        .from('cartorio_acesso_conteudo')
        .select(`
          sistema_id, produto_id, nivel_acesso,
          sistemas (id, nome),
          produtos (id, nome, sistema_id)
        `)
        .eq('cartorio_id', cartorioId)
        .eq('ativo', true);

      if (permissoesError) throw permissoesError;

      // Determinar produtos permitidos
      const produtosPermitidos = new Set<string>();
      const sistemasPermitidos = new Set<string>();

      permissoes?.forEach(permissao => {
        if (permissao.produto_id) {
          produtosPermitidos.add(permissao.produto_id);
        } else if (permissao.sistema_id) {
          sistemasPermitidos.add(permissao.sistema_id);
        }
      });

      // Se não há permissões específicas, considerar todos os produtos
      let produtos = [];
      if (produtosPermitidos.size === 0 && sistemasPermitidos.size === 0) {
        // Buscar todos os produtos
        const { data: todosProdutos, error: produtosError } = await supabase
          .from('produtos')
          .select(`
            id, nome, sistema_id,
            sistemas (nome),
            video_aulas (id)
          `)
          .order('nome');

        if (produtosError) throw produtosError;
        produtos = todosProdutos || [];
      } else {
        // Buscar apenas produtos permitidos
        const { data: produtosFiltrados, error: produtosFiltradosError } = await supabase
          .from('produtos')
          .select(`
            id, nome, sistema_id,
            sistemas (nome),
            video_aulas (id)
          `)
          .or(`id.in.(${Array.from(produtosPermitidos).join(',')}),sistema_id.in.(${Array.from(sistemasPermitidos).join(',')})`)
          .order('nome');

        if (produtosFiltradosError) throw produtosFiltradosError;
        produtos = produtosFiltrados || [];
      }

      // Processar progresso para cada usuário
      const usuariosComProgresso: UsuarioProgresso[] = [];

      for (const usuario of usuariosData) {
        const produtosProgresso = [];
        let totalAulasGeral = 0;
        let aulasConcluidas = 0;

        for (const produto of produtos) {
          const totalAulas = produto.video_aulas?.length || 0;
          totalAulasGeral += totalAulas;

          if (totalAulas > 0) {
            // Buscar visualizações completas do usuário para este produto
            const videoIds = produto.video_aulas.map(v => v.id);
            const { data: visualizacoes, error: visualError } = await supabase
              .from('visualizacoes_cartorio')
              .select('video_aula_id')
              .eq('cartorio_id', cartorioId)
              .eq('completo', true)
              .in('video_aula_id', videoIds);

            if (visualError) {
              console.error('Erro ao buscar visualizações:', visualError);
              continue;
            }

            const aulasConcluidasProduto = visualizacoes?.length || 0;
            aulasConcluidas += aulasConcluidasProduto;
            const percentual = Math.round((aulasConcluidasProduto / totalAulas) * 100);

            produtosProgresso.push({
              id: produto.id,
              nome: produto.nome,
              sistema_nome: produto.sistemas?.nome || 'Sistema não identificado',
              total_aulas: totalAulas,
              aulas_concluidas: aulasConcluidasProduto,
              percentual
            });
          }
        }

        const progressoGeral = {
          total_aulas: totalAulasGeral,
          aulas_concluidas: aulasConcluidas,
          percentual: totalAulasGeral > 0 ? Math.round((aulasConcluidas / totalAulasGeral) * 100) : 0
        };

        usuariosComProgresso.push({
          id: usuario.id,
          username: usuario.username,
          email: usuario.email,
          is_active: usuario.is_active,
          produtos: produtosProgresso,
          progresso_geral: progressoGeral
        });
      }

      setCartorioDetalhado({
        id: cartorioData.id,
        nome: cartorioData.nome,
        cidade: cartorioData.cidade,
        estado: cartorioData.estado,
        usuarios: usuariosComProgresso
      });

    } catch (error) {
      console.error('❌ [UserProgressViewRefactored] Erro ao carregar detalhes:', error);
      toast({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível carregar os detalhes do cartório.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetalhes(false);
    }
  };

  const voltarParaLista = () => {
    setCartorioDetalhado(null);
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

  // Visualização de detalhes do cartório
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
                  onClick={voltarParaLista}
                  className="mr-4 text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <CardTitle className="text-white flex items-center text-enhanced">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg mr-3 shadow-modern">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  Progresso dos Usuários - {cartorioDetalhado.nome}
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
                <p className="text-white text-enhanced">Carregando progresso dos usuários...</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {cartorioDetalhado.usuarios.map((usuario) => (
                  <Card key={usuario.id} className="glass-effect border-gray-600/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white text-enhanced">{usuario.username}</h3>
                          {usuario.email && (
                            <p className="text-sm text-gray-400">{usuario.email}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">
                            {usuario.progresso_geral.aulas_concluidas}/{usuario.progresso_geral.total_aulas} aulas
                          </p>
                          <Badge variant={usuario.progresso_geral.percentual >= 80 ? "default" : "secondary"}>
                            {usuario.progresso_geral.percentual}% concluído
                          </Badge>
                        </div>
                      </div>

                      <div className="mb-4">
                        <Progress value={usuario.progresso_geral.percentual} className="h-2" />
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-white text-enhanced flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-blue-400" />
                          Produtos Acessíveis
                        </h4>
                        <div className="grid gap-2 pl-6">
                          {usuario.produtos.map((produto) => (
                            <div key={produto.id} className="flex items-center justify-between p-3 glass-effect rounded-lg">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{produto.nome}</p>
                                <p className="text-xs text-gray-400">
                                  {produto.sistema_nome} • {produto.aulas_concluidas} de {produto.total_aulas} aulas
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-20">
                                  <Progress value={produto.percentual} className="h-1" />
                                </div>
                                <Badge 
                                  variant={produto.percentual === 100 ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {produto.percentual}%
                                </Badge>
                                {produto.percentual === 100 && (
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                )}
                              </div>
                            </div>
                          ))}
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
                        onClick={() => loadCartorioDetalhes(cartorio.id)}
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