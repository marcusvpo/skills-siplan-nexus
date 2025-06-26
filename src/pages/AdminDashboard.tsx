
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import CartorioManagement from '@/components/CartorioManagement';
import ContentManagement from '@/components/ContentManagement';
import CartorioManagementEnhanced from '@/components/admin/CartorioManagementEnhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Video, 
  AlertCircle, 
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { useAdminStats, useCartoriosList } from '@/hooks/useAdminStats';
import { CartorioUsersManagement } from '@/components/admin/CartorioUsersManagement';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { data: cartorios, isLoading: cartoriosLoading, refetch: refetchCartorios } = useCartoriosList(refreshTrigger > 0);
  const [expandedCartorios, setExpandedCartorios] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      navigate('/admin-login');
    }
  }, [user, navigate]);

  const handleTokenGenerated = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    refetchCartorios();
  }, [refetchCartorios]);

  const handleCartorioUpdate = useCallback(() => {
    refetchCartorios();
  }, [refetchCartorios]);

  const toggleCartorioExpansion = (cartorioId: string) => {
    const newExpanded = new Set(expandedCartorios);
    if (newExpanded.has(cartorioId)) {
      newExpanded.delete(cartorioId);
    } else {
      newExpanded.add(cartorioId);
    }
    setExpandedCartorios(newExpanded);
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Painel Administrativo</h1>
          <p className="text-gray-300">
            Gerencie acessos, conteúdo e configurações da plataforma Siplan Skills
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-600 shadow-modern backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Cartórios Ativos</p>
                  <p className="text-3xl font-bold text-green-400">
                    {statsLoading ? '...' : stats?.cartoriosAtivos}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-600 shadow-modern backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Videoaulas</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {statsLoading ? '...' : stats?.totalVideoaulas}
                  </p>
                </div>
                <Video className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-600 shadow-modern backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Acessos Expirando</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {statsLoading ? '...' : stats?.acessosExpirando}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-600 shadow-modern backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Novos Cadastros</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {statsLoading ? '...' : stats?.novosCadastros}
                  </p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="access" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border border-gray-600">
            <TabsTrigger value="access" className="text-white data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              Gerenciar Acessos
            </TabsTrigger>
            <TabsTrigger value="content" className="text-white data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              Gerenciar Conteúdo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="access" className="mt-6 space-y-6">
            {/* Gerar Token */}
            <CartorioManagement onTokenGenerated={handleTokenGenerated} />

            {/* Lista de Cartórios com Gestão Avançada */}
            <Card className="bg-gray-800/50 border-gray-600 shadow-modern">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Gestão Avançada de Cartórios e Usuários</CardTitle>
                {refreshTrigger > 0 && (
                  <RefreshCw className="h-4 w-4 text-green-400 animate-spin" />
                )}
              </CardHeader>
              <CardContent>
                {cartoriosLoading ? (
                  <p className="text-gray-400">Carregando...</p>
                ) : (
                  <div className="space-y-4">
                    {cartorios?.map((cartorio) => (
                      <div key={cartorio.id}>
                        <CartorioManagementEnhanced
                          cartorio={cartorio}
                          onUpdate={handleCartorioUpdate}
                          isExpanded={expandedCartorios.has(cartorio.id)}
                          onToggleExpansion={() => toggleCartorioExpansion(cartorio.id)}
                        />
                        
                        {/* Seção Expandível de Usuários */}
                        {expandedCartorios.has(cartorio.id) && (
                          <div className="mt-4 ml-8 p-4 border-l-2 border-gray-600">
                            <CartorioUsersManagement 
                              cartorioId={cartorio.id} 
                              cartorioName={cartorio.nome} 
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <ContentManagement />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
