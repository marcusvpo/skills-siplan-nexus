import React from 'react';
import Layout from '@/components/Layout';
import { BookOpen, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-12 page-transition">
        <h1 className="text-3xl font-bold mb-8 text-white">Painel do Administrador</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="gradient-card p-6 rounded-xl cursor-pointer hover:scale-[1.01] transition-transform shadow-modern">
            <BookOpen className="h-8 w-8 mb-4 text-primary" />
            <h2 className="text-xl font-semibold text-white mb-2">Sistemas</h2>
            <p className="text-sm text-muted-foreground">Gerencie os sistemas disponíveis na plataforma.</p>
          </div>

          <div className="gradient-card p-6 rounded-xl cursor-pointer hover:scale-[1.01] transition-transform shadow-modern">
            <Video className="h-8 w-8 mb-4 text-primary" />
            <h2 className="text-xl font-semibold text-white mb-2">Vídeo Aulas</h2>
            <p className="text-sm text-muted-foreground">Adicione ou edite vídeo aulas por produto ou sistema.</p>
          </div>

          <div className="gradient-card p-6 rounded-xl cursor-pointer hover:scale-[1.01] transition-transform shadow-modern">
            <FileText className="h-8 w-8 mb-4 text-primary" />
            <h2 className="text-xl font-semibold text-white mb-2">Relatórios</h2>
            <p className="text-sm text-muted-foreground">Visualize relatórios de desempenho e acesso.</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button variant="outline" className="btn-hover-lift">Acessar como usuário</Button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
