
import React from 'react';
import { useAuth } from '@/contexts/AuthContextFixed';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpen } from 'lucide-react';
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center page-transition">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-6"></div>
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      {showNavigation && user && (
        <header className="glass-effect border-b border-gray-700/50 px-6 py-4 backdrop-blur-md shadow-modern">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div 
              className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-all duration-300 btn-hover-lift"
              onClick={() => navigate(user.type === 'admin' ? '/admin' : '/dashboard')}
            >
              <div className="p-2 gradient-card rounded-lg shadow-modern">
                <BookOpen className="h-8 w-8 text-red-500" />
              </div>
              <span className="text-2xl font-bold text-white text-enhanced">Siplan Skills</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <span className="text-gray-300 font-medium text-enhanced">
                  Bem-vindo(a), {user.name}!
                </span>
                {user.type === 'cartorio' && (
                  <span className="ml-3 px-3 py-1 text-xs bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/30">
                    Cartório
                  </span>
                )}
                {user.type === 'admin' && (
                  <span className="ml-3 px-3 py-1 text-xs bg-red-600/20 text-red-400 rounded-full border border-red-500/30">
                    Admin
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-gray-600/50 text-gray-300 hover:bg-gray-700/30 hover:text-white shadow-modern btn-hover-lift glass-effect"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>
      )}
      
      <main className={`${showNavigation ? "min-h-[calc(100vh-80px)]" : "min-h-screen"} page-transition`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
