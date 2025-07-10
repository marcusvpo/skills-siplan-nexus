
import React from 'react';
import { ArrowRight, Users, Video, Shield } from 'lucide-react';
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
            <img 
              src="/lovable-uploads/938cc4b0-f47e-4bb5-9eb9-1848eaade9af.png" 
              alt="Siplan Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-enhanced text-zinc-50 md:text-8xl">
            Siplan Skills
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-normal md:text-2xl">Plataforma de treinamento especializada para cartórios clientes Siplan. Aprenda sobre nossos sistemas com videoaulas interativas e suporte de IA.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 text-lg btn-hover-lift shadow-modern" onClick={() => navigate('/login')}>
              Acessar Plataforma
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="gradient-card shadow-modern hover:shadow-elevated border-gray-600/50 hover:border-red-500/50 transition-all duration-500 card-enter">
            <CardContent className="p-8 text-center">
              <div className="p-3 bg-gradient-to-br from-red-600 to-red-700 rounded-xl w-fit mx-auto mb-6 shadow-modern">
                <Video className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white text-enhanced">Videoaulas Interativas</h3>
              <p className="text-gray-400 leading-relaxed">
                Aprenda com conteúdo em vídeo de alta qualidade sobre todos os sistemas Siplan.
              </p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card shadow-modern hover:shadow-elevated border-gray-600/50 hover:border-red-500/50 transition-all duration-500 card-enter" style={{
          animationDelay: '0.1s'
        }}>
            <CardContent className="p-8 text-center">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl w-fit mx-auto mb-6 shadow-modern">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white text-enhanced">Chat com IA</h3>
              <p className="text-gray-400 leading-relaxed">
                Tire dúvidas em tempo real com nossa assistente virtual especializada.
              </p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card shadow-modern hover:shadow-elevated border-gray-600/50 hover:border-red-500/50 transition-all duration-500 card-enter" style={{
          animationDelay: '0.2s'
        }}>
            <CardContent className="p-8 text-center">
              <div className="p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-xl w-fit mx-auto mb-6 shadow-modern">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white text-enhanced">Acesso Seguro</h3>
              <p className="text-gray-400 leading-relaxed">
                Ambiente controlado e seguro, exclusivo para cartórios clientes da Siplan.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="gradient-card shadow-elevated border-gray-600/50 max-w-2xl mx-auto">
            <CardContent className="p-8 px-[25px]">
              <h2 className="text-3xl font-bold mb-4 text-white text-enhanced">Pronto para começar?</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Entre em contato com seu representante Siplan para obter seu token de acesso.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
