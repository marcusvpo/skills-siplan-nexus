
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TreinamentosSection } from '@/components/user/TreinamentosSection';

const Dashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Verificações de segurança críticas para usuário cartório
  React.useEffect(() => {
    console.log('🎯 [Dashboard] Current auth state:', { 
      isAuthenticated, 
      userType: user?.type,
      cartorioId: user?.cartorio_id,
      user: user
    });

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
      <div className="min-h-screen flex items-center justify-center page-transition">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-6"></div>
          <p className="text-white text-lg">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white page-transition">
      {/* Header */}
      <div className="border-b border-gray-700/50 glass-effect backdrop-blur-md">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 gradient-card rounded-lg shadow-modern">
                <BookOpen className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-enhanced">Siplan Skills</h1>
                <p className="text-sm text-gray-400">
                  Plataforma de Treinamento
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium flex items-center text-enhanced">
                  <User className="h-4 w-4 mr-2" />
                  {user?.username || user?.name}
                </p>
                <p className="text-xs text-gray-400">{user?.cartorio_name}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-600/50 text-gray-300 hover:bg-gray-700/30 hover:text-white shadow-modern btn-hover-lift glass-effect"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="gradient-card p-8 rounded-xl shadow-elevated border-gray-700/50 mb-8">
            <h2 className="text-4xl font-bold text-white mb-3 text-enhanced">
              Bem-vindo(a), {user?.username || user?.name}!
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Selecione um sistema para começar seu treinamento
            </p>
          </div>
        </div>

        <TreinamentosSection />
      </div>
    </div>
  );
};

export default Dashboard;
