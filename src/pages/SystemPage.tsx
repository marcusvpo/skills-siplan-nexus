
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowRight } from 'lucide-react';
import { useSistemas, useVisualizacoes } from '@/hooks/useSupabaseData';

const SystemPage = () => {
  const { systemId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = React.useState('name-asc');

  const { data: sistemas } = useSistemas();
  const { data: visualizacoes } = useVisualizacoes(user?.cartorio_id || '');

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      navigate('/login');
    }
  }, [user, navigate]);

  const system = sistemas?.find(s => s.id === systemId);

  if (!system) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8 bg-black min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-400">Sistema não encontrado</h1>
          </div>
        </div>
      </Layout>
    );
  }

  const sortedProducts = [...(system.produtos || [])].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.nome.localeCompare(b.nome);
      case 'name-desc':
        return b.nome.localeCompare(a.nome);
      default:
        return 0;
    }
  });

  const getSystemIcon = (systemName: string) => {
    const iconMap: { [key: string]: string } = {
      'Orion': '🌟',
      'Siplan': '📋',
      'Control-M': '🎮',
      'Global': '🌍'
    };
    return iconMap[systemName] || '📚';
  };

  const calculateProgress = (produto: any) => {
    if (!visualizacoes) return 0;
    
    const totalAulas = produto.modulos?.reduce((acc: number, modulo: any) => 
      acc + (modulo.video_aulas?.length || 0), 0) || 0;
    
    if (totalAulas === 0) return 0;
    
    const aulasCompletas = visualizacoes.filter(v => 
      v.completo && produto.modulos?.some((modulo: any) => 
        modulo.video_aulas?.some((aula: any) => aula.id === v.video_aula_id)
      )
    ).length;
    
    return Math.round((aulasCompletas / totalAulas) * 100);
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 bg-black min-h-screen">
        <Breadcrumbs items={[{ label: system.nome }]} />
        
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-4">{getSystemIcon(system.nome)}</span>
            <div>
              <h1 className="text-3xl font-bold text-white">{system.nome}</h1>
              <p className="text-gray-400">{system.descricao}</p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Produtos do Sistema</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Ordenar por:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Selecione a ordenação" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProducts.map((product) => {
            const progress = calculateProgress(product);
            const totalLessons = product.modulos?.reduce((acc: number, modulo: any) => 
              acc + (modulo.video_aulas?.length || 0), 0) || 0;
            
            return (
              <Card 
                key={product.id} 
                className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-300 cursor-pointer group hover:shadow-xl"
                onClick={() => navigate(`/system/${systemId}/product/${product.id}`)}
              >
                <CardHeader>
                  <CardTitle className="group-hover:text-red-400 transition-colors text-white">
                    {product.nome}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm mb-4">
                    {product.descricao}
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2 text-gray-300">
                        <span>Progresso Geral</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {totalLessons} aulas disponíveis
                      </span>
                      <Button 
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 group-hover:scale-105 transition-all duration-200"
                      >
                        Acessar
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {sortedProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Nenhum produto encontrado para este sistema.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SystemPage;
