
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, Play, Package, Layers } from 'lucide-react';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';

export const DashboardStats: React.FC = () => {
  const { data: stats, isLoading, error } = useAdminDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="gradient-card shadow-modern border-gray-600/50">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-600 rounded mb-2"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="gradient-card shadow-modern border-red-600/50 mb-8">
        <CardContent className="p-6">
          <div className="text-center text-red-400">
            <p>Erro ao carregar estatísticas</p>
            <p className="text-sm text-gray-500 mt-1">Tente recarregar a página</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      title: 'Cartórios Ativos',
      value: stats?.cartoriosAtivos || 0,
      icon: Building,
      color: 'from-blue-600 to-blue-700',
      description: 'Cartórios ativos na plataforma'
    },
    {
      title: 'Usuários Cadastrados',
      value: stats?.totalUsuarios || 0,
      icon: Users,
      color: 'from-green-600 to-green-700',
      description: 'Total de usuários (admins + cartórios)'
    },
    {
      title: 'Videoaulas',
      value: stats?.totalVideoaulas || 0,
      icon: Play,
      color: 'from-red-600 to-red-700',
      description: 'Videoaulas cadastradas'
    },
    {
      title: 'Sistemas & Produtos',
      value: `${stats?.totalSistemas || 0} / ${stats?.totalProdutos || 0}`,
      icon: Package,
      color: 'from-purple-600 to-purple-700',
      description: 'Sistemas e produtos cadastrados'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => (
        <Card key={index} className="gradient-card shadow-modern border-gray-600/50 card-enter hover:shadow-elevated transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 bg-gradient-to-br ${item.color} rounded-lg shadow-modern`}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-sm font-medium text-gray-300">
                    {item.title}
                  </CardTitle>
                </div>
                <div className="text-3xl font-bold text-white text-enhanced mb-1">
                  {item.value}
                </div>
                <p className="text-xs text-gray-500">
                  {item.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
