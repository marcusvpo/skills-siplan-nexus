
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
import { 
  Users, 
  Video, 
  AlertCircle, 
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { useAdminStats, useCartoriosList } from '@/hooks/useAdminStats';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { data: cartorios, isLoading: cartoriosLoading } = useCartoriosList(refreshTrigger > 0);

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      navigate('/admin-login');
    }
  }, [user, navigate]);

  const handleTokenGenerated = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

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
            {/* Gerar Token - Movido para aba de Acessos */}
            <CartorioManagement onTokenGenerated={handleTokenGenerated} />

            {/* Lista de Cartórios */}
            <Card className="bg-gray-800/50 border-gray-600 shadow-modern">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Cartórios Cadastrados</CardTitle>
                {refreshTrigger > 0 && (
                  <RefreshCw className="h-4 w-4 text-green-400 animate-spin" />
                )}
              </CardHeader>
              <CardContent>
                {cartoriosLoading ? (
                  <p className="text-gray-400">Carregando...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-600">
                          <TableHead className="text-gray-300">Nome</TableHead>
                          <TableHead className="text-gray-300">CNPJ</TableHead>
                          <TableHead className="text-gray-300">Token</TableHead>
                          <TableHead className="text-gray-300">Status</TableHead>
                          <TableHead className="text-gray-300">Expira</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cartorios?.map((cartorio) => (
                          <TableRow key={cartorio.id} className="border-gray-700 hover:bg-gray-700/30">
                            <TableCell className="font-medium text-white">{cartorio.nome}</TableCell>
                            <TableCell className="text-gray-300">{cartorio.cnpj}</TableCell>
                            <TableCell className="font-mono text-sm text-gray-300">
                              {cartorio.acessos_cartorio?.[0]?.login_token || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={cartorio.acessos_cartorio?.[0]?.ativo ? 'secondary' : 'destructive'}
                                className={cartorio.acessos_cartorio?.[0]?.ativo ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
                              >
                                {cartorio.acessos_cartorio?.[0]?.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {cartorio.acessos_cartorio?.[0]?.data_expiracao 
                                ? new Date(cartorio.acessos_cartorio[0].data_expiracao).toLocaleDateString('pt-BR')
                                : 'N/A'
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
