
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import CartorioManagement from '@/components/CartorioManagement';
import ContentManagement from '@/components/ContentManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Video, 
  AlertCircle, 
  UserPlus,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { useAdminStats, useCartoriosList } from '@/hooks/useAdminStats';
import { CartorioUsersManagement } from '@/components/admin/CartorioUsersManagement';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { data: cartorios, isLoading: cartoriosLoading } = useCartoriosList(refreshTrigger > 0);
  const [expandedCartorios, setExpandedCartorios] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      navigate('/admin-login');
    }
  }, [user, navigate]);

  const handleTokenGenerated = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

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

            {/* Lista de Cartórios com Usuários Expandíveis */}
            <Card className="bg-gray-800/50 border-gray-600 shadow-modern">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Cartórios e Usuários Cadastrados</CardTitle>
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
                      <div key={cartorio.id} className="border border-gray-700 rounded-lg overflow-hidden">
                        {/* Header do Cartório */}
                        <div className="bg-gray-700/30 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCartorioExpansion(cartorio.id)}
                                className="text-gray-300 hover:text-white p-1"
                              >
                                {expandedCartorios.has(cartorio.id) ? 
                                  <ChevronDown className="h-4 w-4" /> : 
                                  <ChevronRight className="h-4 w-4" />
                                }
                              </Button>
                              <div>
                                <h3 className="font-semibold text-white">{cartorio.nome}</h3>
                                <p className="text-sm text-gray-400">
                                  {cartorio.cidade}, {cartorio.estado}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-xs text-gray-400">Token:</p>
                                <p className="font-mono text-sm text-gray-300">
                                  {cartorio.acessos_cartorio?.[0]?.login_token || 'N/A'}
                                </p>
                              </div>
                              <Badge 
                                variant={cartorio.acessos_cartorio?.[0]?.ativo ? 'secondary' : 'destructive'}
                                className={cartorio.acessos_cartorio?.[0]?.ativo ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
                              >
                                {cartorio.acessos_cartorio?.[0]?.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                              <p className="text-sm text-gray-300">
                                Expira: {cartorio.acessos_cartorio?.[0]?.data_expiracao 
                                  ? new Date(cartorio.acessos_cartorio[0].data_expiracao).toLocaleDateString('pt-BR')
                                  : 'N/A'
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Seção Expandível de Usuários */}
                        {expandedCartorios.has(cartorio.id) && (
                          <div className="p-4 border-t border-gray-700">
                            <CartorioUsersManagement cartorioId={cartorio.id} cartorioName={cartorio.nome} />
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
