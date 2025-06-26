
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Play, 
  AlertTriangle, 
  UserPlus, 
  Settings, 
  FileText,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { CartorioManagementFixed } from '@/components/admin/CartorioManagementFixed';
import { ContentManagerAudited } from '@/components/admin/ContentManagerAudited';

type ActiveView = 'dashboard' | 'content' | 'cartorios';

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useAdminStats();

  console.log('📊 [AdminDashboard] Current view:', activeView);
  console.log('📊 [AdminDashboard] Stats:', stats);

  const renderStats = () => {
    if (statsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-gray-800/50 border-gray-600">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (statsError) {
      return (
        <Card className="bg-red-50 border-red-200 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Erro ao carregar estatísticas</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Cartórios Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.cartoriosAtivos || 0}
            </div>
            <p className="text-xs text-gray-400">
              Total de cartórios com acesso ativo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total de Videoaulas
            </CardTitle>
            <Play className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.totalVideoaulas || 0}
            </div>
            <p className="text-xs text-gray-400">
              Conteúdo disponível na plataforma
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Acessos Expirando
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.acessosExpirando || 0}
            </div>
            <p className="text-xs text-gray-400">
              Próximos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Novos Cadastros
            </CardTitle>
            <UserPlus className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.novosCadastros || 0}
            </div>
            <p className="text-xs text-gray-400">
              Últimos 7 dias
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderNavigation = () => (
    <div className="flex space-x-2 mb-8">
      <Button
        variant={activeView === 'dashboard' ? 'default' : 'outline'}
        onClick={() => setActiveView('dashboard')}
        className={activeView === 'dashboard' 
          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
          : 'border-gray-600 text-gray-300 hover:bg-gray-700/50'
        }
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Dashboard
      </Button>
      
      <Button
        variant={activeView === 'content' ? 'default' : 'outline'}
        onClick={() => setActiveView('content')}
        className={activeView === 'content' 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'border-gray-600 text-gray-300 hover:bg-gray-700/50'
        }
      >
        <FileText className="h-4 w-4 mr-2" />
        Gerenciar Conteúdo
      </Button>
      
      <Button
        variant={activeView === 'cartorios' ? 'default' : 'outline'}
        onClick={() => setActiveView('cartorios')}
        className={activeView === 'cartorios' 
          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
          : 'border-gray-600 text-gray-300 hover:bg-gray-700/50'
        }
      >
        <Settings className="h-4 w-4 mr-2" />
        Gerenciar Cartórios
      </Button>
    </div>
  );

  const renderDashboardView = () => (
    <div>
      {renderStats()}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setActiveView('content')}
              className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Gerenciar Conteúdo
            </Button>
            <Button
              onClick={() => setActiveView('cartorios')}
              className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Cartórios
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Status:</span>
                <Badge variant="default" className="bg-green-600">
                  Online
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Versão:</span>
                <span className="text-white">1.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Última atualização:</span>
                <span className="text-white text-sm">
                  {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return renderDashboardView();
      case 'content':
        return <ContentManagerAudited />;
      case 'cartorios':
        return <CartorioManagementFixed />;
      default:
        return renderDashboardView();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">
            Painel Administrativo
          </h1>
          <Badge variant="outline" className="text-blue-400 border-blue-400">
            Administrador
          </Badge>
        </div>

        {renderNavigation()}
        
        {renderContent()}
      </div>
    </Layout>
  );
}
