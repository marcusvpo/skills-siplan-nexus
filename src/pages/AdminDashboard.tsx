
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, BarChart, Settings } from 'lucide-react';
import Layout from '@/components/Layout';
import { ContentManagerRefactored } from '@/components/admin/ContentManagerRefactored';
import { CartorioList } from '@/components/admin/CartorioList';
import { useAdminStats } from '@/hooks/useAdminStats';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Painel Administrativo</h1>
            <p className="text-gray-300">Gerencie o sistema Siplan Skills</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Cartórios Ativos
                </CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? '-' : stats?.cartoriosAtivos || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Videoaulas
                </CardTitle>
                <FileText className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? '-' : stats?.totalVideoaulas || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Acessos Expirando
                </CardTitle>
                <BarChart className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? '-' : stats?.acessosExpirando || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Novos Cadastros
                </CardTitle>
                <Settings className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? '-' : stats?.novosCadastros || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger 
                value="content" 
                className="text-gray-300 data-[state=active]:bg-red-600 data-[state=active]:text-white"
              >
                Gerenciar Conteúdo
              </TabsTrigger>
              <TabsTrigger 
                value="cartorios" 
                className="text-gray-300 data-[state=active]:bg-red-600 data-[state=active]:text-white"
              >
                Gerenciar Cartórios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Gerenciamento de Conteúdo</CardTitle>
                  <p className="text-gray-300">
                    Gerencie sistemas, produtos e videoaulas da plataforma
                  </p>
                </CardHeader>
                <CardContent>
                  <ContentManagerRefactored />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cartorios" className="space-y-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Gerenciamento de Cartórios</CardTitle>
                  <p className="text-gray-300">
                    Gerencie cartórios e seus acessos ao sistema
                  </p>
                </CardHeader>
                <CardContent>
                  <CartorioList />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
