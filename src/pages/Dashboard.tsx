import React from 'react';
import { useNavigate } from 'react-router-dom';
// Importa useAuth da versão FIXA
import { useAuth } from '@/contexts/AuthContextFixed'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TreinamentosSection } from '@/components/user/TreinamentosSection';
import { CartorioSessionManager } from '@/components/CartorioSessionManager';


const Dashboard = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Verificações de segurança críticas para usuário cartório
  React.useEffect(() => {
    console.log('🎯 [Dashboard] Current auth state:', { 
      isAuthenticated, 
      userType: user?.type,
      cartorioId: (user as any)?.cartorio_id,
      activeTrilhaId: (user as any)?.active_trilha_id,
      user: user,
      isLoading
    });

    // Não fazer verificações se ainda estiver carregando
    if (isLoading) {
      console.log('⏳ [Dashboard] Still loading, waiting...');
      return;
    }

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

    if (!(user as any)?.cartorio_id) {
      console.error('❌ [Dashboard] User has no cartorio_id');
      toast({
        title: "Erro de configuração",
        description: "Usuário não está associado a um cartório.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // BIFURCAÇÃO CRÍTICA: Redirecionar usuários com trilha ativa para o fluxo de trilha
    const activeTrilhaId = (user as any)?.active_trilha_id;
    if (activeTrilhaId) {
      console.log('🎯 [Dashboard] FLUXO B: Usuário de Trilha detectado. Redirecionando para /trilha/roadmap');
      navigate('/trilha/roadmap', { replace: true });
      return;
    }

    // Se chegou aqui, é um Usuário Comum (sem trilha ativa) - FLUXO A
    console.log('✅ [Dashboard] FLUXO A: Usuário Comum detectado. Exibindo dashboard padrão.');
  }, [isAuthenticated, user, navigate, isLoading]);

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

  // Loading state - mostrar apenas se realmente carregando
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center page-transition bg-black">
        <Card className="gradient-card shadow-elevated border-gray-600/50">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white text-enhanced">Carregando dados do usuário...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white page-transition">
      {/* Gerenciador de sessão invisível */}
      <CartorioSessionManager />
      
      {/* Header */}
      <div className="border-b border-gray-700/50 glass-effect backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/lovable-uploads/05a1d51a-f20d-4875-b8bc-f30942943e7d.png" 
                alt="Siplan Logo" 
                className="h-8 w-auto object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-enhanced">Siplan Skills</h1>
                <p className="text-sm text-gray-400">
                  Plataforma de Treinamento
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Card className="gradient-card shadow-modern border-gray-600/50">
                <CardContent className="p-3">
                  <div className="text-right">
                    <p className="text-sm font-medium flex items-center text-white text-enhanced">
                      <User className="h-4 w-4 mr-2" />
                      {user?.username || user?.name}
                    </p>
                    <p className="text-xs text-gray-400">{user?.cartorio_name}</p>
                  </div>
                </CardContent>
              </Card>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50 btn-hover-lift shadow-modern"
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
        <Card className="gradient-card shadow-elevated border-gray-600/50 mb-8 card-enter">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-white text-enhanced">
              Bem-vindo(a), {user?.username || user?.name}!
            </CardTitle>
            <p className="text-gray-400 text-lg">
              Selecione um sistema para começar seu treinamento
            </p>
          </CardHeader>
        </Card>

        <TreinamentosSection />
      </div>
    </div>
  );
};

export default Dashboard;