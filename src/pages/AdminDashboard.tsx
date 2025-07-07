
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, Settings, LogOut, FileText, Play, Building } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

// Componentes restaurados
import CartorioManagerRestored from '@/components/admin/CartorioManagerRestored';
import { ContentManagerFixed } from '@/components/admin/ContentManagerFixed';
import { DashboardStats } from '@/components/admin/DashboardStats';

const AdminDashboard = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cartorios');

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
        <Card className="gradient-card shadow-elevated border-gray-600/50">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white text-enhanced">Verificando permissões...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white page-transition">
      {/* Header */}
      <div className="border-b border-gray-700/50 glass-effect backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-modern">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-enhanced">Siplan Skills - Admin</h1>
                <p className="text-sm text-gray-400">
                  Painel de Administração
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Card className="gradient-card shadow-modern border-gray-600/50">
                <CardContent className="p-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white text-enhanced">{user?.name || 'Administrador'}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
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
        {/* Indicadores de estatísticas */}
        <DashboardStats />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <Card className="gradient-card shadow-modern border-gray-600/50">
            <CardContent className="p-1">
              <TabsList className="grid w-full grid-cols-3 glass-effect border-gray-700/50 p-1">
                <TabsTrigger 
                  value="cartorios" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white transition-all duration-300 btn-hover-lift"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Cartórios
                </TabsTrigger>
                <TabsTrigger 
                  value="conteudo"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white transition-all duration-300 btn-hover-lift"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Conteúdo
                </TabsTrigger>
                <TabsTrigger 
                  value="configuracoes"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white transition-all duration-300 btn-hover-lift"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          <TabsContent value="cartorios" className="space-y-6">
            <CartorioManagerRestored />
          </TabsContent>

          <TabsContent value="conteudo" className="space-y-6">
            <ContentManagerFixed />
          </TabsContent>

          <TabsContent value="configuracoes" className="space-y-6">
            <Card className="gradient-card shadow-elevated border-gray-600/50 card-enter">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-enhanced">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg mr-3 shadow-modern">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  Configurações do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Configurações avançadas em desenvolvimento...
                </p>
                <div className="mt-6 p-4 glass-effect rounded-lg border border-gray-600/50">
                  <p className="text-sm text-gray-500">
                    Funcionalidades futuras incluirão configurações de sistema, 
                    personalização de temas e gerenciamento de notificações.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
