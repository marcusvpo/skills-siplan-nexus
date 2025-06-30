
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContextEnhanced';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpen, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

const LayoutEnhanced: React.FC<LayoutProps> = ({ children, showNavigation = true }) => {
  const { user, logout, isLoading, isInitialized, refreshSession } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (err) {
      logger.error('❌ [LayoutEnhanced] Error during logout:', err);
      toast({
        title: "Erro no logout",
        description: "Houve um problema ao desconectar. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshSession = async () => {
    try {
      await refreshSession();
      toast({
        title: "Sessão atualizada",
        description: "Sua sessão foi renovada com sucesso.",
      });
    } catch (err) {
      logger.error('❌ [LayoutEnhanced] Error refreshing session:', err);
      toast({
        title: "Erro ao renovar sessão",
        description: "Não foi possível renovar a sessão. Tente fazer login novamente.",
        variant: "destructive",
      });
    }
  };

  // Verificar se deve mostrar loading apenas se não foi inicializado
  if (!isInitialized && isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="flex items-center space-x-3 text-white">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Verificando autenticação...</span>
        </div>
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
                variant="ghost"
                size="sm"
                onClick={handleRefreshSession}
                className="text-gray-400 hover:text-white transition-colors"
                title="Renovar sessão"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
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

export default LayoutEnhanced;
