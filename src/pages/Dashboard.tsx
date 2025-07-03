
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Play, Users, BookOpen, Award } from 'lucide-react';
import { useSistemasData } from '@/hooks/useSupabaseDataSimplified';
import { logger } from '@/utils/logger';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: sistemas, isLoading, error } = useSistemasData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white">Carregando sistemas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    logger.error('❌ [Dashboard] Error loading systems:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-red-600">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold text-red-400 mb-2">Erro ao carregar dashboard</h3>
            <p className="text-gray-400 mb-4">{error.message}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sistemas || sistemas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-600">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-6">📚</div>
            <h3 className="text-2xl font-semibold text-gray-300 mb-3">Nenhum sistema disponível</h3>
            <p className="text-gray-400">
              Entre em contato com o administrador para obter acesso aos sistemas de treinamento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard de Treinamento</h1>
          <p className="text-gray-400">Selecione um sistema para começar seu treinamento</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Sistemas</p>
                  <p className="text-2xl font-bold text-white">{sistemas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Play className="h-8 w-8 text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Videoaulas</p>
                  <p className="text-2xl font-bold text-white">-</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Concluídas</p>
                  <p className="text-2xl font-bold text-white">-</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-600 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Progresso</p>
                  <p className="text-2xl font-bold text-white">-%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sistemas
            .sort((a, b) => a.ordem - b.ordem)
            .map((sistema) => (
              <Card 
                key={sistema.id} 
                className="bg-gray-800/50 border-gray-600 hover:border-red-500/50 transition-all duration-300 cursor-pointer group backdrop-blur-sm"
                onClick={() => navigate(`/system/${sistema.id}`)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-white group-hover:text-red-400 transition-colors">
                    {sistema.nome}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sistema.descricao && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {sistema.descricao}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Sistema #{sistema.ordem}
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/system/${sistema.id}`);
                      }}
                    >
                      Acessar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
