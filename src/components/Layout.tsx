
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <div className="text-white text-enhanced">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      {showNavigation && user && (
        <header className="border-b border-gray-700/50 glass-effect backdrop-blur-md">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity btn-hover-lift"
              onClick={() => navigate(user.type === 'admin' ? '/admin' : '/dashboard')}
            >
              <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-modern">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white text-enhanced">Siplan Skills</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-gray-300 text-enhanced">
                Bem-vindo(a), {user.name}!
                {user.type === 'cartorio' && (
                  <span className="ml-2 px-3 py-1 text-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-modern">
                    Cartório
                  </span>
                )}
                {user.type === 'admin' && (
                  <span className="ml-2 px-3 py-1 text-xs bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full shadow-modern">
                    Admin
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white btn-hover-lift shadow-modern"
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
