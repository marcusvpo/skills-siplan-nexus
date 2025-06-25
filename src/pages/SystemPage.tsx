
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { systems } from '@/data/mockData';
import { ArrowRight } from 'lucide-react';

const SystemPage = () => {
  const { systemId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = React.useState('name-asc');

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      navigate('/login');
    }
  }, [user, navigate]);

  const system = systems.find(s => s.id === systemId);

  if (!system) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-400">Sistema não encontrado</h1>
          </div>
        </div>
      </Layout>
    );
  }

  const sortedProducts = [...system.products].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <Breadcrumbs items={[{ label: system.name }]} />
        
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-4">{system.icon}</span>
            <div>
              <h1 className="text-3xl font-bold">{system.name}</h1>
              <p className="text-gray-400">{system.description}</p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Produtos do Sistema</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Ordenar por:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
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
          {sortedProducts.map((product) => (
            <Card 
              key={product.id} 
              className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all cursor-pointer group"
              onClick={() => navigate(`/system/${systemId}/product/${product.id}`)}
            >
              <CardHeader>
                <CardTitle className="group-hover:text-red-400 transition-colors">
                  {product.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  {product.description}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progresso Geral</span>
                      <span>{product.progress}%</span>
                    </div>
                    <Progress value={product.progress} className="h-2" />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {product.lessons.length} aulas disponíveis
                    </span>
                    <Button 
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 group-hover:scale-105 transition-transform"
                    >
                      Acessar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
