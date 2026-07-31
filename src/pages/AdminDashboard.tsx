import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Importa useAuth da versão FIXA
import { useAuth } from '@/contexts/AuthContextFixed'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, LogOut, FileText, Building } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

// Componentes
import { CartorioManagementComplete } from '@/components/admin/CartorioManagementComplete';
import { ContentManagerFixed } from '@/components/admin/ContentManagerFixed';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { TrilhaManager } from '@/components/admin/TrilhaManager';
import { QuizManager } from '@/components/admin/QuizManager';

const AdminDashboard = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'cartorios');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === 'cartorios' ? {} : { tab }, { replace: true });
  };

  // Verificações de segurança críticas
  React.useEffect(() => {
    logger.info('🔐 [AdminDashboard] Security check:', { 
      isAuthenticated, 
      isAdmin, 
      userType: user?.type 
    });

    if (!isAuthenticated) {
      logger.warn('⚠️ [AdminDashboard] User not authenticated, redirecting to admin login');
      navigate('/admin-login');
      return;
    }

    if (!isAdmin && user?.type !== 'admin') {
      logger.warn('⚠️ [AdminDashboard] User is not admin, redirecting to login');
      toast({
        title: "Acesso negado",
        description: "Você não tem permissões administrativas.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
  }, [isAuthenticated, isAdmin, user, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate('/');
    } catch (error) {
      logger.error('❌ [AdminDashboard] Logout error:', error);
      toast({
        title: "Erro no logout",
        description: "Houve um problema ao fazer logout.",
        variant: "destructive",
      });
    }
  };

  // Não renderizar nada enquanto fazemos as verificações de segurança
  if (!isAuthenticated || (!isAdmin && user?.type !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center page-transition">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-foreground">Verificando permissões...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-transition min-h-screen text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/lovable-uploads/05a1d51a-f20d-4875-b8bc-f30942943e7d.png" 
                alt="Siplan Logo" 
                className="h-8 w-auto object-contain"
              />
              <div>
                <h1 className="text-xl font-bold tracking-tight">Siplan Skills · Admin</h1>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Painel de administração
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden rounded-xl border border-border/50 bg-card/60 px-3 py-2 text-right backdrop-blur-md sm:block">
                <p className="text-sm font-medium text-foreground">{user?.name || 'Administrador'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Indicadores de estatísticas */}
        <DashboardStats />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-1 lg:grid-cols-4">
            <TabsTrigger value="cartorios">
              <Building className="h-4 w-4 mr-2" />
              Cartórios
            </TabsTrigger>
            <TabsTrigger value="conteudo">
              <FileText className="h-4 w-4 mr-2" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="personalizacao">
              <FileText className="h-4 w-4 mr-2" />
              Personalização
            </TabsTrigger>
            <TabsTrigger value="configuracoes">
              <Users className="h-4 w-4 mr-2" />
              Progresso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cartorios" className="space-y-6">
            <CartorioManagementComplete />
          </TabsContent>

          <TabsContent value="conteudo" className="space-y-6">
            <ContentManagerFixed />
          </TabsContent>

          <TabsContent value="personalizacao" className="space-y-6">
            <Tabs defaultValue="trilhas" className="space-y-4">
              <TabsList>
                <TabsTrigger value="trilhas">Gestão de Trilhas</TabsTrigger>
                <TabsTrigger value="quizzes">Gestão de Quizzes</TabsTrigger>
              </TabsList>
              <TabsContent value="trilhas">
                <Card>
                  <CardContent className="p-6">
                    <TrilhaManager />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="quizzes">
                <Card>
                  <CardContent className="p-6">
                    <QuizManager />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="configuracoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Progresso dos Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Visualize o progresso de aprendizagem dos usuários dos cartórios.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;