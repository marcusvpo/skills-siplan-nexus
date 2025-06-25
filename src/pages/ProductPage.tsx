
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Clock, ArrowRight } from 'lucide-react';
import { useSistemas, useVisualizacoes } from '@/hooks/useSupabaseData';

const ProductPage = () => {
  const { systemId, productId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = React.useState('ordem-asc');

  const { data: sistemas } = useSistemas();
  const { data: visualizacoes } = useVisualizacoes(user?.cartorio_id || '');

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      navigate('/login');
    }
  }, [user, navigate]);

  const system = sistemas?.find(s => s.id === systemId);
  const product = system?.produtos?.find(p => p.id === productId);

  if (!system || !product) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8 bg-black min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-400">Produto não encontrado</h1>
          </div>
        </div>
      </Layout>
    );
  }

  const sortedModules = [...(product.modulos || [])].sort((a, b) => {
    switch (sortBy) {
      case 'ordem-asc':
        return (a.ordem || 0) - (b.ordem || 0);
      case 'nome-asc':
        return a.titulo.localeCompare(b.titulo);
      case 'nome-desc':
        return b.titulo.localeCompare(a.titulo);
      default:
        return 0;
    }
  });

  const calculateModuleProgress = (modulo: any) => {
    if (!visualizacoes || !modulo.video_aulas) return 0;
    
    const totalAulas = modulo.video_aulas.length;
    if (totalAulas === 0) return 0;
    
    const aulasCompletas = visualizacoes.filter(v => 
      v.completo && modulo.video_aulas.some((aula: any) => aula.id === v.video_aula_id)
    ).length;
    
    return Math.round((aulasCompletas / totalAulas) * 100);
  };

  const calculateOverallProgress = () => {
    if (!product.modulos || product.modulos.length === 0) return 0;
    
    const totalAulas = product.modulos.reduce((acc: number, modulo: any) => 
      acc + (modulo.video_aulas?.length || 0), 0);
    
    if (totalAulas === 0) return 0;
    
    const aulasCompletas = visualizacoes?.filter(v => 
      v.completo && product.modulos.some((modulo: any) => 
        modulo.video_aulas?.some((aula: any) => aula.id === v.video_aula_id)
      )
    ).length || 0;
    
    return Math.round((aulasCompletas / totalAulas) * 100);
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 bg-black min-h-screen">
        <Breadcrumbs items={[
          { label: system.nome, href: `/system/${systemId}` },
          { label: product.nome }
        ]} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">{product.nome}</h1>
          <p className="text-gray-400 mb-4">{product.descricao}</p>
          
          {/* Overall Progress */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">Progresso Geral do Produto</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Progress value={calculateOverallProgress()} className="h-3" />
              </div>
              <span className="font-semibold text-lg text-white">{calculateOverallProgress()}%</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {product.modulos?.reduce((acc: number, modulo: any) => 
                acc + (visualizacoes?.filter(v => v.completo && modulo.video_aulas?.some((aula: any) => aula.id === v.video_aula_id)).length || 0), 0
              )} de {product.modulos?.reduce((acc: number, modulo: any) => acc + (modulo.video_aulas?.length || 0), 0)} aulas concluídas
            </p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Módulos de Treinamento</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Ordenar por:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-56 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Selecione a ordenação" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="ordem-asc">Ordem Padrão</SelectItem>
                <SelectItem value="nome-asc">Nome (A-Z)</SelectItem>
                <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedModules.map((modulo) => {
            const progress = calculateModuleProgress(modulo);
            const totalLessons = modulo.video_aulas?.length || 0;
            const completedLessons = visualizacoes?.filter(v => 
              v.completo && modulo.video_aulas?.some((aula: any) => aula.id === v.video_aula_id)
            ).length || 0;
            
            return (
              <Card 
                key={modulo.id} 
                className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-300 cursor-pointer group hover:shadow-xl"
                onClick={() => navigate(`/system/${systemId}/product/${productId}/module/${modulo.id}`)}
              >
                <CardHeader>
                  <CardTitle className="group-hover:text-red-400 transition-colors text-white">
                    {modulo.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm mb-4">
                    {modulo.descricao}
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2 text-gray-300">
                        <span>Progresso</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {modulo.tempo_estimado_min ? `${modulo.tempo_estimado_min}min` : 'N/A'}
                      </div>
                      <span>
                        {completedLessons}/{totalLessons} aulas
                      </span>
                    </div>
                    
                    <Button 
                      className="w-full bg-red-600 hover:bg-red-700 group-hover:scale-105 transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/system/${systemId}/product/${productId}/module/${modulo.id}`);
                      }}
                    >
                      {progress > 0 ? 'Continuar Módulo' : 'Iniciar Módulo'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {sortedModules.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Nenhum módulo encontrado para este produto.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Novos módulos serão adicionados em breve.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductPage;
