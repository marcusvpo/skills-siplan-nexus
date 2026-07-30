import React from 'react';
import { useNavigate } from 'react-router-dom';
// Importa useAuth da versão FIXA
import { useAuth } from '@/contexts/AuthContextFixed'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TreinamentosSection } from '@/components/user/TreinamentosSection';
import { LearnerHero } from '@/components/user/LearnerHero';
import { LearnerStats } from '@/components/user/LearnerStats';
import { ContinueWatchingBanner } from '@/components/user/ContinueWatchingBanner';
import { CartorioSessionManager } from '@/components/CartorioSessionManager';


const Dashboard = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Verificações de segurança críticas para usuário cartório
  React.useEffect(() => {
    console.log('🎯 [Dashboard] ======== VERIFICAÇÃO DE ROTEAMENTO ========');
    console.log('🎯 [Dashboard] isLoading:', isLoading);
    console.log('🎯 [Dashboard] isAuthenticated:', isAuthenticated);
    console.log('🎯 [Dashboard] user.type:', user?.type);
    console.log('🎯 [Dashboard] user.cartorio_id:', (user as any)?.cartorio_id);
    console.log('🎯 [Dashboard] user.active_trilha_id:', (user as any)?.active_trilha_id);
    console.log('🎯 [Dashboard] user completo:', user);

    // Não fazer verificações se ainda estiver carregando
    if (isLoading) {
      console.log('⏳ [Dashboard] Ainda carregando, aguardando...');
      return;
    }

    if (!isAuthenticated) {
      console.warn('⚠️ [Dashboard] Usuário não autenticado, redirecionando para /login');
      navigate('/login');
      return;
    }

    if (user?.type !== 'cartorio') {
      console.warn('⚠️ [Dashboard] Usuário não é do tipo cartório, redirecionando');
      if (user?.type === 'admin') {
        navigate('/admin');
      } else {
        navigate('/login');
      }
      return;
    }

    if (!(user as any)?.cartorio_id) {
      console.error('❌ [Dashboard] Usuário não tem cartorio_id');
      toast({
        title: "Erro de configuração",
        description: "Usuário não está associado a um cartório.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // Todos os usuários de cartório agora seguem o mesmo fluxo
    console.log('✅ [Dashboard] Usuário de cartório autenticado. Exibindo dashboard padrão.');
    console.log('🎯 [Dashboard] ======== FIM DA VERIFICAÇÃO ========');
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
      <main className="container mx-auto space-y-8 px-4 py-8">
        <LearnerHero
          nome={user?.username || user?.name || 'aluno'}
          cartorio={user?.cartorio_name}
        />
        <LearnerStats />
        <ContinueWatchingBanner />
        <TreinamentosSection />
      </main>
    </div>
  );
};

export default Dashboard;