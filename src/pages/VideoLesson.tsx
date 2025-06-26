
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import VideoPlayer from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, BookOpen, Play, MessageCircle, Send, Bot, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSistemas } from '@/hooks/useSupabaseData';
import ProgressDisplay from '@/components/ProgressDisplay';

const VideoLesson = () => {
  const { systemId, productId, lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: sistemas } = useSistemas();

  useEffect(() => {
    if (!user || user.type !== 'cartorio') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Find the current lesson data
  let currentLesson = null;
  let currentModule = null;
  let currentProduct = null;
  let currentSystem = null;
  
  if (sistemas) {
    for (const system of sistemas) {
      if (system.id === systemId) {
        currentSystem = system;
        for (const product of system.produtos || []) {
          if (product.id === productId) {
            currentProduct = product;
            for (const module of product.modulos || []) {
              for (const lesson of module.video_aulas || []) {
                if (lesson.id === lessonId) {
                  currentLesson = lesson;
                  currentModule = module;
                  break;
                }
              }
              if (currentLesson) break;
            }
            if (currentLesson) break;
          }
        }
        if (currentLesson) break;
      }
    }
  }

  if (!currentSystem || !currentProduct || !currentModule || !currentLesson) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
          <Card className="glass-effect border-gray-700 max-w-md">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-red-400 mb-4">Aula não encontrada</h1>
              <p className="text-gray-400 mb-6">A aula solicitada não foi encontrada ou você não tem permissão para acessá-la.</p>
              <Button onClick={() => navigate('/dashboard')} className="bg-red-600 hover:bg-red-700">
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Mock chat messages for AI chat preview
  const mockChatMessages = [
    {
      type: 'bot',
      message: `Olá! Como posso ajudar com este vídeo sobre "${currentLesson.titulo}"?`,
      timestamp: new Date()
    },
    {
      type: 'user', 
      message: 'Qual a diferença entre Registro de Imóveis e Notas?',
      timestamp: new Date()
    },
    {
      type: 'bot',
      message: 'Em breve, você poderá tirar dúvidas diretamente com nossa IA especializada sobre o conteúdo desta videoaula.',
      timestamp: new Date()
    }
  ];

  // Get all lessons in current module for navigation
  const moduleLessons = currentModule.video_aulas || [];
  const currentLessonIndex = moduleLessons.findIndex(lesson => lesson.id === lessonId);
  const previousLesson = currentLessonIndex > 0 ? moduleLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < moduleLessons.length - 1 ? moduleLessons[currentLessonIndex + 1] : null;

  const toggleFavorite = () => {
    console.log('Toggle favorite for lesson:', lessonId);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-6 py-8">
          <Breadcrumbs items={[
            { label: currentSystem.nome, href: `/system/${systemId}` },
            { label: currentProduct.nome, href: `/system/${systemId}/product/${productId}` },
            { label: currentModule.titulo, href: `/system/${systemId}/product/${productId}/module/${currentModule.id}` },
            { label: currentLesson.titulo }
          ]} />
          
          <div className="grid lg:grid-cols-3 gap-8 mt-6">
            {/* Main Video Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              <div className="glass-effect rounded-2xl overflow-hidden shadow-modern">
                <VideoPlayer videoUrl={currentLesson.url_video} title={currentLesson.titulo} />
              </div>
              
              {/* Lesson Information */}
              <Card className="glass-effect border-gray-700">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <h1 className="text-3xl font-bold text-white">{currentLesson.titulo}</h1>
                        <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-0">
                          <Play className="h-3 w-3 mr-1" />
                          Videoaula
                        </Badge>
                      </div>
                      
                      <p className="text-gray-300 text-lg leading-relaxed mb-6">
                        {currentLesson.descricao}
                      </p>
                      
                      <div className="flex items-center space-x-8 text-gray-400">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 mr-2" />
                          <span className="text-lg">{currentLesson.duracao_segundos ? `${Math.floor(currentLesson.duracao_segundos / 60)}min` : 'N/A'}</span>
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="h-5 w-5 mr-2" />
                          <span className="text-lg">{currentModule.titulo}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={toggleFavorite}
                      className="text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Star className="h-8 w-8" />
                    </Button>
                  </div>
                  
                  {/* Progress Section */}
                  <div className="border-t border-gray-700 pt-6 mb-6">
                    <h3 className="text-xl font-semibold mb-4 text-white">Seu Progresso</h3>
                    <ProgressDisplay
                      progressSegundos={0} // This would come from user progress data
                      duracaoSegundos={currentLesson.duracao_segundos || 0}
                      completo={false}
                      size="lg"
                    />
                  </div>
                  
                  {/* About Section */}
                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-xl font-semibold mb-3 text-white">Sobre esta aula</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Esta videoaula faz parte do módulo <strong>{currentModule.titulo}</strong> do produto <strong>{currentProduct.nome}</strong> 
                      do sistema <strong>{currentSystem.nome}</strong>. Aprenda as funcionalidades essenciais e melhores práticas 
                      para otimizar seu trabalho no cartório.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Between Lessons */}
              <Card className="glass-effect border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {previousLesson ? (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/system/${systemId}/product/${productId}/lesson/${previousLesson.id}`)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Aula Anterior
                        </Button>
                      ) : (
                        <div></div>
                      )}
                    </div>
                    
                    <div className="flex-1 text-center">
                      <p className="text-gray-400 text-sm">
                        {currentLessonIndex + 1} de {moduleLessons.length} aulas
                      </p>
                    </div>
                    
                    <div className="flex-1 text-right">
                      {nextLesson ? (
                        <Button
                          onClick={() => navigate(`/system/${systemId}/product/${productId}/lesson/${nextLesson.id}`)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Próxima Aula
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      ) : (
                        <div></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* AI Chat Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Card className="glass-effect border-gray-700 h-[700px] flex flex-col">
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-center mb-6">
                      <div className="p-2 bg-blue-600 rounded-lg mr-3">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">Pergunte à IA sobre este treinamento</h3>
                    </div>
                    
                    {/* Chat Messages Area */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                      {mockChatMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-start space-x-3 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <div className={`p-2 rounded-full ${msg.type === 'user' ? 'bg-red-600' : 'bg-blue-600'}`}>
                              {msg.type === 'user' ? (
                                <User className="h-4 w-4 text-white" />
                              ) : (
                                <Bot className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <div className={`p-4 rounded-lg ${msg.type === 'user' ? 'bg-red-600/20 border border-red-500/30' : 'bg-gray-700/50 border border-gray-600'}`}>
                              <p className="text-white text-sm leading-relaxed">{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Chat Input */}
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          placeholder="Digite sua pergunta aqui..."
                          className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                          disabled
                        />
                        <Button
                          size="lg"
                          className="bg-red-600 hover:bg-red-700 px-4"
                          disabled
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Chat com IA será ativado em breve
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          {/* Module Lessons Navigation */}
          <div className="mt-12">
            <Card className="glass-effect border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-6 text-white flex items-center">
                  <BookOpen className="h-6 w-6 mr-3 text-blue-400" />
                  Outras aulas deste módulo
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moduleLessons.map((lesson, index) => (
                    <Card
                      key={lesson.id}
                      className={`cursor-pointer transition-all duration-300 ${
                        lesson.id === lessonId 
                          ? 'bg-red-600/20 border-red-500' 
                          : 'bg-gray-800/50 border-gray-600 hover:border-red-500/50'
                      }`}
                      onClick={() => navigate(`/system/${systemId}/product/${productId}/lesson/${lesson.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${lesson.id === lessonId ? 'bg-red-600' : 'bg-gray-600'}`}>
                            <Play className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm">{lesson.titulo}</h4>
                            <p className="text-xs text-gray-400 mt-1">
                              Aula {index + 1} • {lesson.duracao_segundos ? `${Math.floor(lesson.duracao_segundos / 60)}min` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VideoLesson;
