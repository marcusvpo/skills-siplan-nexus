
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {showNavigation && user && (
        <header className="bg-gray-900 border-b border-gray-700 px-6 py-4">
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
                {user.type === 'cartorio' && ' (Cartório)'}
                {user.type === 'admin' && ' (Admin)'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>
      )}
      
      <main className={`${showNavigation ? "min-h-[calc(100vh-80px)]" : "min-h-screen"} bg-black`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
