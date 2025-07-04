import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Eye, EyeOff, AlertCircle, User, RefreshCw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client'; // Importar a instância global do Supabase

const Login = () => {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  // Obtém isAuthenticated e isLoading diretamente do AuthContextFixed
  const { login, isAuthenticated, isLoading: authContextLoading } = useAuth(); 

  const handleDemo = () => {
    setUsername('demo');
    setToken('DEMO-SIPLANSKILLS-CARTORIO');
    setError('');
    logger.userAction('Demo credentials filled');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // O isLoading local do componente Login

    setError('');

    try {
      logger.userAction('Login attempt started', { username, hasToken: !!token });
      
      const response = await fetch('https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Certifique-se que esta ANONYMOUS KEY é a sua REAL ANONYMOUS KEY do Supabase
          // Você pode encontrá-la em Project Settings -> API -> Project API keys -> public anon key
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
      logger.info('Verificando se data.session e data.user estão presentes:', {
          hasSession: !!data.session,
          hasUser: !!data.user
      });

      // --- LÓGICA CRÍTICA: DEFINIR SESSÃO SUPABASE ---
      if (data.success && data.session && data.user && data.cartorio && data.usuario) {
        logger.info('Tentando definir sessão Supabase...');
        
        logger.info('Tokens recebidos para setSession:', {
          accessTokenExists: !!data.session.access_token,
          refreshTokenExists: !!data.session.refresh_token,
          accessTokenType: typeof data.session.access_token,
          refreshTokenType: typeof data.session.refresh_token,
        });
        
        // --- REMOVIDO: A chamada await supabase.auth.getSession() e seus logs ---
        // Este é o ponto crucial para o seu problema atual de "Verificando..."
        // Ela não deve estar aqui.
        
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (setSessionError) {
          logger.error('Falha ao definir sessão Supabase:', setSessionError);
          throw new Error(`Falha ao estabelecer sessão Supabase: ${setSessionError.message}`);
        }
        logger.info('Sessão Supabase definida com sucesso para o usuário:', data.user.id);

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
        
        // --- NOVO PASSO: ESPERAR O CONTEXTO DE AUTENTICAÇÃO SE ESTABILIZAR ANTES DE NAVEGAR ---
        logger.info('Aguardando AuthContextFixed se estabilizar...');
        let attempts = 0;
        const maxAttempts = 50; // Tentar por no máximo 5 segundos (50 * 100ms)
        // Usa o isLoading do AuthContextFixed para saber se está pronto
        while ((!isAuthenticated || authContextLoading) && attempts < maxAttempts) {
            logger.info(`Aguardando... isAuthenticated: ${isAuthenticated}, isLoading (AuthContext): ${authContextLoading}. Tentativa ${attempts + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, 100)); // Espera 100ms
            attempts++;
        }

        if (!isAuthenticated) {
            logger.error('AuthContextFixed não se estabilizou a tempo. Navegando mesmo assim.');
        } else {
            logger.info('AuthContextFixed estabilizado. Navegando para o Dashboard.');
        }
        // --- FIM DO NOVO PASSO ---

        navigate('/dashboard'); 
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
      logger.info('Finalizando processo de login, setando isLoading para false.');
      setIsLoading(false); // Garante que o loading local do Login seja desativado
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
                  disabled={isLoading} // Usa o isLoading local
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
                  disabled={isLoading} // Usa o isLoading local
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowToken(!showToken)}
                  disabled={isLoading} // Usa o isLoading local
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50"
              disabled={isLoading} // Usa o isLoading local
            >
              {isLoading ? ( // Usa o isLoading local para o texto do botão
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Verificando...</span>
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
              disabled={isLoading} // Usa o isLoading local
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