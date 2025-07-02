
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {showNavigation && user && (
        <header className="bg-gray-800/80 border-b border-gray-600 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(user.type === 'admin' ? '/admin' : '/dashboard')}
            >
              <BookOpen className="h-8 w-8 text-red-500" />
              <span className="text-2xl font-bold text-white">Siplan Skills</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">
                Bem-vindo(a), {user.name}!
                {user.type === 'cartorio' && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded">
                    Cartório
                  </span>
                )}
                {user.type === 'admin' && (
                  <span className="ml-2 px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded">
                    Admin
                  </span>
                )}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>
      )}
      
      <main className={`${showNavigation ? "min-h-[calc(100vh-80px)]" : "min-h-screen"} bg-[#1a1a1a]`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
