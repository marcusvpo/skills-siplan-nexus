
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TreinamentosSection } from '@/components/user/TreinamentosSection';

const Dashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Verificações de segurança críticas para usuário cartório
  React.useEffect(() => {
    if (!isAuthenticated) {
      console.warn('⚠️ [Dashboard] User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    if (user?.type !== 'cartorio') {
      console.warn('⚠️ [Dashboard] User is not cartorio type, redirecting');
      if (user?.type === 'admin') {
        navigate('/admin');
      } else {
        navigate('/login');
      }
      return;
    }

    if (!user?.cartorio_id) {
      console.error('❌ [Dashboard] User has no cartorio_id');
      toast({
        title: "Erro de configuração",
        description: "Usuário não está associado a um cartório.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
  }, [isAuthenticated, user?.type, user?.cartorio_id, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate('/');
    } catch (error) {
      console.error('❌ [Dashboard] Logout error:', error);
      toast({
        title: "Erro no logout",
        description: "Houve um problema ao fazer logout.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white">Carregando dados do usuário...</p>
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

        <TreinamentosSection />
      </div>
    </div>
  );
};

export default Dashboard;
