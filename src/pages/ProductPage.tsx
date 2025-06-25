
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { systems } from '@/data/mockData';
import { Play, Star, Clock, CheckCircle } from 'lucide-react';

const ProductPage = () => {
  const { systemId, productId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = React.useState('recent');

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      navigate('/login');
    }
  }, [user, navigate]);

  const system = systems.find(s => s.id === systemId);
  const product = system?.products.find(p => p.id === productId);

  if (!system || !product) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-400">Produto não encontrado</h1>
          </div>
        </div>
      </Layout>
    );
  }

  const sortedLessons = [...product.lessons].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.title.localeCompare(b.title);
      case 'name-desc':
        return b.title.localeCompare(a.title);
      case 'status':
        if (a.completed && !b.completed) return -1;
        if (!a.completed && b.completed) return 1;
        return 0;
      default:
        return 0;
    }
  });

  const toggleFavorite = (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Lógica para toggle de favorito seria implementada aqui
    console.log('Toggle favorite for lesson:', lessonId);
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <Breadcrumbs items={[
          { label: system.name, href: `/system/${systemId}` },
          { label: product.name }
        ]} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-400 mb-4">{product.description}</p>
          
          {/* Overall Progress */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Progresso Geral do Produto</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Progress value={product.progress} className="h-3" />
              </div>
              <span className="font-semibold text-lg">{product.progress}%</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {product.lessons.filter(l => l.completed).length} de {product.lessons.length} aulas concluídas
            </p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Videoaulas</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Ordenar por:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-56 bg-gray-800 border-gray-700">
                <SelectValue placeholder="Selecione a ordenação" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="name-asc">Ordem Alfabética (A-Z)</SelectItem>
                <SelectItem value="name-desc">Ordem Alfabética (Z-A)</SelectItem>
                <SelectItem value="status">Status (Concluídas/Não Concluídas)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lessons List */}
        <div className="space-y-4">
          {sortedLessons.map((lesson) => (
            <Card 
              key={lesson.id} 
              className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all cursor-pointer"
              onClick={() => navigate(`/system/${systemId}/product/${productId}/lesson/${lesson.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="bg-red-600 rounded-full p-3">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{lesson.title}</h3>
                        {lesson.completed && (
                          <Badge variant="secondary" className="bg-green-600 text-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Concluída
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-3">
                        {lesson.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {lesson.duration}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => toggleFavorite(lesson.id, e)}
                      className="text-gray-400 hover:text-yellow-500"
                    >
                      <Star 
                        className={`h-5 w-5 ${lesson.favorite ? 'fill-current text-yellow-500' : ''}`} 
                      />
                    </Button>
                    
                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/system/${systemId}/product/${productId}/lesson/${lesson.id}`);
                      }}
                    >
                      {lesson.completed ? 'Revisar Aula' : 'Iniciar Aula'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedLessons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Nenhuma videoaula encontrada para este produto.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Novas aulas serão adicionadas em breve.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductPage;
