
import React from 'react';
import { BookOpen, ArrowRight, Users, Video, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Siplan Skills
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Plataforma de treinamento especializada para cartórios clientes da Siplan. 
            Aprenda sobre nossos sistemas com videoaulas interativas e suporte de IA.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg transition-all duration-200 hover:shadow-lg"
              onClick={() => navigate('/login')}
            >
              Acessar Plataforma
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-4 text-lg transition-all duration-200"
              onClick={() => navigate('/admin-login')}
            >
              Acesso Administrativo
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6 text-center">
              <Video className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">Videoaulas Interativas</h3>
              <p className="text-gray-400">
                Aprenda com conteúdo em vídeo de alta qualidade sobre todos os sistemas Siplan.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">Chat com IA</h3>
              <p className="text-gray-400">
                Tire dúvidas em tempo real com nossa assistente virtual especializada.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">Acesso Seguro</h3>
              <p className="text-gray-400">
                Ambiente controlado e seguro, exclusivo para cartórios clientes da Siplan.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Pronto para começar?</h2>
          <p className="text-gray-400 mb-8">
            Entre em contato com seu representante Siplan para obter seu token de acesso.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
