
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import VideoPlayer from '@/components/VideoPlayer';
import AIChat from '@/components/AIChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { systems } from '@/data/mockData';
import { Star, Clock, BookOpen } from 'lucide-react';

const VideoLesson = () => {
  const { systemId, productId, lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      navigate('/login');
    }
  }, [user, navigate]);

  const system = systems.find(s => s.id === systemId);
  const product = system?.products.find(p => p.id === productId);
  const lesson = product?.lessons.find(l => l.id === lessonId);

  if (!system || !product || !lesson) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-400">Aula não encontrada</h1>
          </div>
        </div>
      </Layout>
    );
  }

  const toggleFavorite = () => {
    // Lógica para toggle de favorito seria implementada aqui
    console.log('Toggle favorite for lesson:', lessonId);
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <Breadcrumbs items={[
          { label: system.name, href: `/system/${systemId}` },
          { label: product.name, href: `/system/${systemId}/product/${productId}` },
          { label: lesson.title }
        ]} />
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Section */}
          <div className="lg:col-span-2 space-y-6">
            <VideoPlayer videoUrl={lesson.videoUrl} title={lesson.title} />
            
            {/* Lesson Information */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
                    <p className="text-gray-400 mb-4">{lesson.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {lesson.duration}
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {product.name}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFavorite}
                    className="text-gray-400 hover:text-yellow-500"
                  >
                    <Star 
                      className={`h-6 w-6 ${lesson.favorite ? 'fill-current text-yellow-500' : ''}`} 
                    />
                  </Button>
                </div>
                
                {/* Additional lesson details could go here */}
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="font-semibold mb-2">Sobre esta aula</h3>
                  <p className="text-gray-400 text-sm">
                    Esta videoaula faz parte do módulo {product.name} do sistema {system.name}. 
                    Aprenda as funcionalidades essenciais e melhores práticas para otimizar 
                    seu trabalho no cartório.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* AI Chat Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <AIChat lessonTitle={lesson.title} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VideoLesson;
