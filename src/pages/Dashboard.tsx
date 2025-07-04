// UI atualizada com padrão visual da página de videoaula
import React from 'react';
import Layout from '@/user/Layout';
import { BookOpen, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 page-transition">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Bem-vindo(a), {user?.name}
          </h1>
          <p className="mt-4 text-gray-300 text-lg max-w-2xl mx-auto">
            Gerencie os treinamentos do seu cartório e explore os recursos disponíveis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Videoaulas */}
          <div className="gradient-card border border-gray-600 p-6 rounded-lg hover:shadow-elevated transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <Video className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold text-white text-center mb-2">Videoaulas</h2>
            <p className="text-gray-400 text-center mb-4">
              Acesse os vídeos de treinamento dos sistemas disponíveis no seu cartório.
            </p>
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 btn-hover-lift"
              onClick={() => navigate('/products')}
            >
              Acessar Videoaulas
            </Button>
          </div>

          {/* Documentos */}
          <div className="gradient-card border border-gray-600 p-6 rounded-lg hover:shadow-elevated transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold text-white text-center mb-2">Documentos</h2>
            <p className="text-gray-400 text-center mb-4">
              Em breve: consulte materiais de apoio e manuais técnicos dos produtos.
            </p>
            <Button 
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200 btn-hover-lift"
              disabled
            >
              Em Breve
            </Button>
          </div>

          {/* Suporte */}
          <div className="gradient-card border border-gray-600 p-6 rounded-lg hover:shadow-elevated transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold text-white text-center mb-2">Ajuda com IA</h2>
            <p className="text-gray-400 text-center mb-4">
              Tire dúvidas com o assistente virtual treinado para atender cartórios.
            </p>
            <Button 
              variant="outline"
              onClick={() => navigate('/chat')}
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200 btn-hover-lift"
            >
              Acessar Chat
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
