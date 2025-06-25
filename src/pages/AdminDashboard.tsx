
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import AdminManagement from '@/components/AdminManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Video, 
  AlertCircle, 
  UserPlus,
} from 'lucide-react';
import { useAdminStats, useCartoriosList } from '@/hooks/useAdminStats';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: cartorios, isLoading: cartoriosLoading } = useCartoriosList();

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      navigate('/admin-login');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-gray-400">
            Gerencie acessos, conteúdo e configurações da plataforma Siplan Skills
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
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

          <Card className="bg-gray-800 border-gray-700">
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

          <Card className="bg-gray-800 border-gray-700">
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

          <Card className="bg-gray-800 border-gray-700">
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
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="access">Gerenciar Acessos</TabsTrigger>
            <TabsTrigger value="content">Gerenciar Conteúdo</TabsTrigger>
          </TabsList>

          <TabsContent value="access" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Cartórios Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                {cartoriosLoading ? (
                  <p className="text-gray-400">Carregando...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Token</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expira</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartorios?.map((cartorio) => (
                        <TableRow key={cartorio.id}>
                          <TableCell className="font-medium">{cartorio.nome}</TableCell>
                          <TableCell>{cartorio.cnpj}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {cartorio.acessos_cartorio?.[0]?.login_token || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={cartorio.acessos_cartorio?.[0]?.ativo ? 'secondary' : 'destructive'}
                              className={cartorio.acessos_cartorio?.[0]?.ativo ? 'bg-green-600' : 'bg-red-600'}
                            >
                              {cartorio.acessos_cartorio?.[0]?.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {cartorio.acessos_cartorio?.[0]?.data_expiracao 
                              ? new Date(cartorio.acessos_cartorio[0].data_expiracao).toLocaleDateString()
                              : 'N/A'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <AdminManagement />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
