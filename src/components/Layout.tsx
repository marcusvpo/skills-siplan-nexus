
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {showNavigation && user && (
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(user.type === 'admin' ? '/admin' : '/dashboard')}
            >
              <BookOpen className="h-8 w-8 text-red-500" />
              <span className="text-2xl font-bold">Siplan Skills</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">
                Bem-vindo(a), {user.name}!
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>
      )}
      
      <main className={showNavigation ? "min-h-[calc(100vh-80px)]" : "min-h-screen"}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
