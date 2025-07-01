import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Play, TrendingUp, Clock } from 'lucide-react';
import { useSistemasCartorioWithAccess } from '@/hooks/useSupabaseDataWithAccess';
import { useVisualizacoes } from '@/hooks/useSupabaseDataFixed';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: sistemas = [], isLoading: sistemasLoading } = useSistemasCartorioWithAccess();
  const { data: visualizacoes = [], isLoading: visualizacoesLoading } = useVisualizacoes();

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-gray-400">Você precisa estar logado para acessar o dashboard.</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalVideoAulas = sistemas.reduce((acc, sistema) => 
    acc + (sistema.produtos?.reduce((prodAcc, produto) => 
      prodAcc + (produto.video_aulas?.length || 0), 0) || 0), 0
  );

  const completedLessons = visualizacoes.filter(v => v.completo).length;
  const inProgressLessons = visualizacoes.filter(v => !v.completo && v.progresso_segundos > 0).length;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Bem-vindo, {user.name}!
          </h1>
          <p className="text-gray-400">
            {user.cartorio_name && `${user.cartorio_name} • `}
            Acompanhe seu progresso nos treinamentos da Siplan Skills
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total de Aulas
              </CardTitle>
              <BookOpen className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {sistemasLoading ? <Skeleton className="h-8 w-16 bg-gray-800" /> : totalVideoAulas}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Concluídas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {visualizacoesLoading ? <Skeleton className="h-8 w-16 bg-gray-800" /> : completedLessons}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Em Progresso
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {visualizacoesLoading ? <Skeleton className="h-8 w-16 bg-gray-800" /> : inProgressLessons}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Sistemas Disponíveis
              </CardTitle>
              <Play className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {sistemasLoading ? <Skeleton className="h-8 w-16 bg-gray-800" /> : sistemas.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Systems Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Sistemas Disponíveis</h2>
          
          {sistemasLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 bg-gray-800" />
                    <Skeleton className="h-4 w-full bg-gray-800" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-1/2 bg-gray-800" />
                      <Skeleton className="h-4 w-1/3 bg-gray-800" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sistemas.length === 0 ? (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Nenhum sistema disponível
                </h3>
                <p className="text-gray-400">
                  Entre em contato com o administrador para liberar o acesso aos sistemas de treinamento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sistemas.map((sistema) => (
                <Link
                  key={sistema.id}
                  to={`/system/${sistema.id}`}
                  className="block transition-transform hover:scale-105"
                >
                  <Card className="bg-gray-900/50 border-gray-700 hover:border-red-600/50 transition-colors h-full">
                    <CardHeader>
                      <CardTitle className="text-white">{sistema.nome}</CardTitle>
                      {sistema.descricao && (
                        <p className="text-gray-400 text-sm">{sistema.descricao}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Produtos:</span>
                          <span className="text-white font-medium">
                            {sistema.produtos?.length || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Total de Aulas:</span>
                          <span className="text-white font-medium">
                            {sistema.produtos?.reduce((acc, produto) => 
                              acc + (produto.video_aulas?.length || 0), 0) || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
