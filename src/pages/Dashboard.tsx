
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, LogOut, Play, User, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { useSistemasCartorio } from '@/hooks/useSistemasCartorio';

const Dashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { sistemas, isLoading, error } = useSistemasCartorio();

  // Verificações de segurança críticas para usuário cartório
  React.useEffect(() => {
    logger.info('🎯 [Dashboard] Security check:', { 
      isAuthenticated, 
      userType: user?.type,
      cartorioId: user?.cartorio_id 
    });

    if (!isAuthenticated) {
      logger.warn('⚠️ [Dashboard] User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    if (user?.type !== 'cartorio') {
      logger.warn('⚠️ [Dashboard] User is not cartorio type, redirecting');
      if (user?.type === 'admin') {
        navigate('/admin');
      } else {
        navigate('/login');
      }
      return;
    }

    if (!user?.cartorio_id) {
      logger.error('❌ [Dashboard] User has no cartorio_id');
      toast({
        title: "Erro de configuração",
        description: "Usuário não está associado a um cartório.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate('/');
    } catch (error) {
      logger.error('❌ [Dashboard] Logout error:', error);
      toast({
        title: "Erro no logout",
        description: "Houve um problema ao fazer logout.",
        variant: "destructive",
      });
    }
  };

  const handleSistemaClick = (sistema: any) => {
    logger.info('🎯 [Dashboard] Sistema clicked:', sistema.id);
    navigate(`/system/${sistema.id}`);
  };

  // Não renderizar nada enquanto fazemos as verificações de segurança
  if (!isAuthenticated || user?.type !== 'cartorio' || !user?.cartorio_id) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold">Siplan Skills</h1>
                <p className="text-sm text-gray-400">
                  Plataforma de Treinamento
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {user?.username || user?.name}
                </p>
                <p className="text-xs text-gray-400">{user?.cartorio_name}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Bem-vindo(a), {user?.username || user?.name}!
          </h2>
          <p className="text-gray-400">
            Selecione um sistema para começar seu treinamento
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando sistemas disponíveis...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="py-8">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-300 mb-2">Erro ao carregar sistemas</h3>
                <p className="text-red-200 mb-4">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : sistemas.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Nenhum sistema disponível</h3>
                <p className="text-gray-400">
                  Entre em contato com o administrador para liberar acesso aos sistemas de treinamento.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sistemas.map((sistema) => (
              <Card
                key={sistema.id}
                className="bg-gray-800/50 border-gray-700 hover:border-red-500 transition-all duration-300 cursor-pointer group"
                onClick={() => handleSistemaClick(sistema)}
              >
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>{sistema.nome}</span>
                    <Play className="h-5 w-5 text-red-500 group-hover:text-red-400 transition-colors" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sistema.descricao && (
                    <p className="text-gray-400 text-sm mb-4">
                      {sistema.descricao}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Sistema #{sistema.ordem}
                    </span>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Acessar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
