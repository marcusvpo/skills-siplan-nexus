import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Eye, EyeOff, AlertCircle, User, RefreshCw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
// import { supabase } from '@/integrations/supabase/client'; // Não é necessário importar aqui

const Login = () => {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  // Obtém isAuthenticated e isLoading diretamente do AuthContextFixed
  const { login, isAuthenticated, isLoading: authContextLoading } = useAuth(); 

  // Efeito para monitorar as mudanças de estado de autenticação
  useEffect(() => {
    logger.info('🔑 [LoginComponent] Auth state update:', {
      isAuthenticated: isAuthenticated,
      authContextLoading: authContextLoading,
      componentIsLoading: isLoading
    });

    if (isAuthenticated && !authContextLoading && isLoading) {
      logger.info('�� [LoginComponent] AuthContext indica autenticação bem-sucedida, navegando.');
      setIsLoading(false);
      navigate('/dashboard');
    } else if (isAuthenticated && !authContextLoading && !isLoading) {
      logger.info('🔑 [LoginComponent] AuthContext já autenticado e estável. Navegando para dashboard.');
      navigate('/dashboard');
    }
  }, [isAuthenticated, authContextLoading, isLoading, navigate]);

  const handleDemo = () => {
    setUsername('demo');
    setToken('DEMO-SIPLANSKILLS-CARTORIO');
    setError('');
    logger.userAction('Demo credentials filled');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      logger.userAction('Login attempt started', { username, hasToken: !!token });

      const response = await fetch('https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`,
        },
        body: JSON.stringify({ username, login_token: token }),
      });

      logger.info('Login response received', { status: response.status });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `Erro HTTP ${response.status}`,
          code: 'HTTP_ERROR'
        }));

        logger.error('Login failed', { error: errorData, status: response.status });
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      logger.info('Login successful response data:', data);

      if (data.success && data.session && data.user && data.cartorio && data.usuario) {
        logger.info('✅ [Login] Edge Function retornou sucesso. Chamando login do contexto...');

        login(token, 'cartorio', { 
          id: data.user.id,
          name: data.usuario.username,
          cartorio_id: data.cartorio.id,
          cartorio_name: data.cartorio.nome,
          username: data.usuario.username,
          email: data.usuario.email 
        });

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo(a), ${data.usuario.username} - ${data.cartorio.nome}!`,
        });

      } else {
        throw new Error(data.error || 'Resposta inválida do servidor ou sessão Supabase ausente.');
      }
    } catch (error) {
      logger.error('Erro no login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      let friendlyMessage = errorMessage;
      if (errorMessage.includes('INVALID_TOKEN')) {
        friendlyMessage = 'Token não encontrado. Verifique se digitou corretamente.';
      } else if (errorMessage.includes('EXPIRED_TOKEN')) {
        friendlyMessage = 'Token expirado. Entre em contato com o administrador.';
      } else if (errorMessage.includes('INACTIVE_TOKEN')) {
        friendlyMessage = 'Token desativado. Entre em contato com o administrador.';
      } else if (errorMessage.includes('INACTIVE_CARTORIO')) {
        friendlyMessage = 'Cartório inativo. Entre em contato com o administrador.';
      } else if (errorMessage.includes('USER_NOT_FOUND')) {
        friendlyMessage = 'Usuário não encontrado ou inativo.';
      } else if (errorMessage.includes('MISSING_FIELDS')) {
        friendlyMessage = 'Preencha todos os campos obrigatórios.';
      } else if (errorMessage.includes('AUTH_SYSTEM_ERROR') || errorMessage.includes('AUTH_USER_CREATION_ERROR')) {
        friendlyMessage = 'Erro na autenticação interna. Por favor, tente novamente ou contate o suporte.';
      } else if (errorMessage.includes('NO_SESSION_RETURNED')) {
        friendlyMessage = 'O servidor não retornou uma sessão de autenticação válida. Contate o suporte.';
      }

      setError(friendlyMessage);

      toast({
        title: "Erro no login",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      logger.info('🔑 [Login] Finalizando processo de login.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#1a1a1a] to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800/80 border-gray-600 shadow-modern backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">Siplan Skills</CardTitle>
          <p className="text-gray-300 mt-2">
            Insira suas credenciais para acessar a plataforma
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Nome de Usuário"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pl-10 focus:border-red-500 focus:ring-red-500/20 transition-all"
                  required
                  disabled={isLoading}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  placeholder="Token do Cartório"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    setError('');
                  }}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pr-10 focus:border-red-500 focus:ring-red-500/20 transition-all"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowToken(!showToken)}
                  disabled={isLoading}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Autenticando...</span>
                </div>
              ) : (
                'Entrar na Plataforma'
              )}
            </Button>
          </form>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
              onClick={handleDemo}
              disabled={isLoading}
            >
              Acessar Demonstração
            </Button>
            
            <div className="text-center">
              <Link 
                to="/admin-login"
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Acesso Administrativo
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;