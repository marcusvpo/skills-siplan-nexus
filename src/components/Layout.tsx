import React from 'react';
// Importa useAuth da versão FIXA
import { useAuth } from '@/contexts/AuthContextFixed'; 
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNavigation = true }) => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Mostrar loading apenas se realmente estiver carregando e não há usuário
  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showNavigation && user && (
        <header className="border-b border-border/50 bg-card/70 backdrop-blur-md">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
              onClick={() => navigate(user.type === 'admin' ? '/admin' : '/dashboard')}
            >
              <img 
                src="/lovable-uploads/05a1d51a-f20d-4875-b8bc-f30942943e7d.png" 
                alt="Siplan Logo" 
                className="h-8 w-auto object-contain shrink-0"
              />
              <span className="text-2xl font-bold text-foreground truncate">Siplan Skills</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-muted-foreground flex items-center gap-2">
                <span className="truncate">Bem-vindo(a), {user.name}!</span>
                {user.type === 'cartorio' && (
                  <Badge variant="secondary" className="rounded-full">
                    Cartório
                  </Badge>
                )}
                {user.type === 'admin' && (
                  <Badge variant="destructive" className="rounded-full">
                    Admin
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="rounded-xl"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>
      )}
      
      <main className={`${showNavigation ? "min-h-[calc(100vh-80px)]" : "min-h-screen"}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
