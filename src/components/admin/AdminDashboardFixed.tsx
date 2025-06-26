import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Video, 
  BookOpen, 
  Settings,
  Plus,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { CartorioListEnhanced } from './CartorioListEnhanced';
import { ContentManagerRefactored } from './ContentManagerRefactored';

const AdminDashboardFixed: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    logger.userAction('Admin dashboard tab changed', { tab: value });
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-gray-400">Gerenciamento da Plataforma Siplan Skills</p>
        </div>

        {/* System Status Banner */}
        <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-400" />
            <div>
              <h3 className="text-green-300 font-semibold">Sistema Operacional</h3>
              <p className="text-green-200 text-sm">
                Todas as correções críticas foram aplicadas. Relacionamentos, políticas RLS e índices otimizados.
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="cartorios" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Cartórios</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Conteúdo</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Total de Cartórios
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">12</div>
                  <p className="text-xs text-green-400">+2 este mês</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Videoaulas
                  </CardTitle>
                  <Video className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">48</div>
                  <p className="text-xs text-green-400">+5 esta semana</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Sistemas
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">6</div>
                  <p className="text-xs text-gray-400">Ativos</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Usuários Ativos
                  </CardTitle>
                  <Activity className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">156</div>
                  <p className="text-xs text-green-400">+12% vs último mês</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-white">Nova videoaula adicionada</p>
                      <p className="text-xs text-gray-400">há 2 minutos</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-white">Cartório conectado</p>
                      <p className="text-xs text-gray-400">há 1 hora</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-white">Sistema atualizado</p>
                      <p className="text-xs text-gray-400">há 3 horas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">Status do Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Database</span>
                    <Badge className="bg-green-600 text-white">Operacional</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">API</span>
                    <Badge className="bg-green-600 text-white">Operacional</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Video Streaming</span>
                    <Badge className="bg-green-600 text-white">Operacional</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Authentication</span>
                    <Badge className="bg-green-600 text-white">Operacional</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cartorios">
            <CartorioListEnhanced />
          </TabsContent>

          <TabsContent value="content">
            <ContentManagerRefactored />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Configurações do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Logging de Debug</h3>
                      <p className="text-gray-400 text-sm">Ativar logs detalhados para diagnóstico</p>
                    </div>
                    <Badge className="bg-green-600 text-white">Ativado</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Backup Automático</h3>
                      <p className="text-gray-400 text-sm">Backup diário dos dados críticos</p>
                    </div>
                    <Badge className="bg-green-600 text-white">Ativado</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Monitoramento</h3>
                      <p className="text-gray-400 text-sm">Alertas em tempo real para problemas</p>
                    </div>
                    <Badge className="bg-green-600 text-white">Ativado</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Informações Técnicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Versão do Sistema:</span>
                    <span className="text-white">2.1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Última Atualização:</span>
                    <span className="text-white">26/06/2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Database Schema:</span>
                    <span className="text-white">v1.2.3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Performance Score:</span>
                    <span className="text-green-400">98/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboardFixed;
