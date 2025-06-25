
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Video, 
  AlertCircle, 
  UserPlus, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Calendar,
  BarChart3
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      navigate('/admin-login');
    }
  }, [user, navigate]);

  if (!user) return null;

  // Mock data for admin dashboard
  const stats = {
    activeCartoriums: 42,
    totalLessons: 156,
    expiringAccess: 8,
    newRegistrations: 3
  };

  const cartoriums = [
    {
      id: '1',
      name: 'Cartório 1º Tabelionato',
      cnpj: '12.345.678/0001-90',
      status: 'Ativo',
      expiryDate: '2024-12-31',
      token: 'CART-ABC123'
    },
    {
      id: '2',
      name: 'Cartório Registro Civil',
      cnpj: '98.765.432/0001-10',
      status: 'Expirado',
      expiryDate: '2024-06-15',
      token: 'CART-XYZ789'
    }
  ];

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
                  <p className="text-3xl font-bold text-green-400">{stats.activeCartoriums}</p>
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
                  <p className="text-3xl font-bold text-blue-400">{stats.totalLessons}</p>
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
                  <p className="text-3xl font-bold text-yellow-400">{stats.expiringAccess}</p>
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
                  <p className="text-3xl font-bold text-purple-400">{stats.newRegistrations}</p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="access" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="access">Gerenciar Acessos</TabsTrigger>
            <TabsTrigger value="content">Gerenciar Conteúdo</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="access" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Cartórios Cadastrados</CardTitle>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Gerar Novo Token
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartoriums.map((cartorio) => (
                    <div key={cartorio.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{cartorio.name}</h3>
                        <p className="text-sm text-gray-400">CNPJ: {cartorio.cnpj}</p>
                        <p className="text-sm text-gray-400">Token: {cartorio.token}</p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <Badge 
                            variant={cartorio.status === 'Ativo' ? 'secondary' : 'destructive'}
                            className={cartorio.status === 'Ativo' ? 'bg-green-600' : 'bg-red-600'}
                          >
                            {cartorio.status}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            Expira: {cartorio.expiryDate}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="border-gray-600">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-gray-600">
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-600 text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Plus className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Criar Novo Sistema</h3>
                    <p className="text-gray-400 text-sm">
                      Adicionar um novo sistema à plataforma
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Plus className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Criar Novo Produto</h3>
                    <p className="text-gray-400 text-sm">
                      Adicionar um produto a um sistema existente
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Plus className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Criar Nova Aula</h3>
                    <p className="text-gray-400 text-sm">
                      Adicionar uma nova videoaula
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Conteúdo Existente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-gray-400">
                      <p>Visualização hierárquica do conteúdo da plataforma:</p>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="space-y-2 text-sm">
                        <div className="font-semibold">📋 Siplan</div>
                        <div className="ml-4">
                          <div>├── Siplan WEBRI (45% progresso médio)</div>
                          <div>└── Siplan WEBTD (20% progresso médio)</div>
                        </div>
                        
                        <div className="font-semibold">🌟 Orion</div>
                        <div className="ml-4">
                          <div>├── Orion TN (65% progresso médio)</div>
                          <div>│   ├── Introdução ao Orion TN</div>
                          <div>│   └── Cadastro de Clientes</div>
                          <div>├── Orion Pro (30% progresso médio)</div>
                          <div>└── Orion Reg (0% progresso médio)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Configurações Gerais da Plataforma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome da Plataforma</label>
                  <Input 
                    defaultValue="Siplan Skills" 
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email de Contato</label>
                  <Input 
                    defaultValue="suporte@siplan.com" 
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Settings className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                  <Button variant="outline" className="border-gray-600">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Limpar Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
