
import React from 'react';
import { BookOpen, ArrowRight, Users, Video, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white page-transition">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 gradient-card rounded-full shadow-elevated">
              <BookOpen className="h-16 w-16 text-red-500" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-enhanced">
            Siplan Skills
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Plataforma de treinamento especializada para cartórios clientes da Siplan. 
            Aprenda sobre nossos sistemas com videoaulas interativas e suporte de IA.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 text-lg shadow-modern btn-hover-lift"
              onClick={() => navigate('/login')}
            >
              Acessar Plataforma
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700/30 hover:text-white px-8 py-4 text-lg shadow-modern btn-hover-lift glass-effect"
              onClick={() => navigate('/admin-login')}
            >
              Acesso Administrativo
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="gradient-card shadow-modern hover:shadow-elevated border-gray-700/50 card-enter">
            <CardContent className="p-8 text-center">
              <div className="p-3 bg-gradient-to-br from-red-600/20 to-red-700/20 rounded-lg w-fit mx-auto mb-6">
                <Video className="h-12 w-12 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white text-enhanced">Videoaulas Interativas</h3>
              <p className="text-gray-300 leading-relaxed">
                Aprenda com conteúdo em vídeo de alta qualidade sobre todos os sistemas Siplan.
              </p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card shadow-modern hover:shadow-elevated border-gray-700/50 card-enter" style={{animationDelay: '0.1s'}}>
            <CardContent className="p-8 text-center">
              <div className="p-3 bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-lg w-fit mx-auto mb-6">
                <Users className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white text-enhanced">Chat com IA</h3>
              <p className="text-gray-300 leading-relaxed">
                Tire dúvidas em tempo real com nossa assistente virtual especializada.
              </p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card shadow-modern hover:shadow-elevated border-gray-700/50 card-enter" style={{animationDelay: '0.2s'}}>
            <CardContent className="p-8 text-center">
              <div className="p-3 bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-lg w-fit mx-auto mb-6">
                <Shield className="h-12 w-12 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white text-enhanced">Acesso Seguro</h3>
              <p className="text-gray-300 leading-relaxed">
                Ambiente controlado e seguro, exclusivo para cartórios clientes da Siplan.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="gradient-card shadow-elevated border-gray-700/50 max-w-2xl mx-auto">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4 text-white text-enhanced">Pronto para começar?</h2>
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                Entre em contato com seu representante Siplan para obter seu token de acesso.
              </p>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 shadow-modern btn-hover-lift"
                onClick={() => navigate('/login')}
              >
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
