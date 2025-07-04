
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Eye, EyeOff, AlertCircle, User, RefreshCw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContextFixed';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

const Login = () => {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

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
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`, // omitido
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
      logger.info('Login successful', { 
        cartorio: data.cartorio?.nome,
        usuario: data.usuario?.username
      });

      if (data.success && data.token && data.cartorio && data.usuario) {
        login(data.token, 'cartorio', {
          id: data.usuario.id,
          name: data.usuario.username,
          cartorio_id: data.cartorio.id,
          cartorio_name: data.cartorio.nome,
          username: data.usuario.username
        });
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo(a), ${data.usuario.username} - ${data.cartorio.nome}!`,
        });
        
        navigate('/dashboard');
      } else {
        throw new Error(data.error || 'Resposta inválida do servidor');
      }
    } catch (error) {
      logger.error('Login error', error);
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
      }

      setError(friendlyMessage);

      toast({
        title: "Erro no login",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 page-transition">
      <Card className="w-full max-w-md gradient-card shadow-elevated border-gray-700/50">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 gradient-card rounded-full shadow-modern">
              <BookOpen className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white text-enhanced">Siplan Skills</CardTitle>
          <p className="text-gray-300 mt-3 leading-relaxed">
            Insira suas credenciais para acessar a plataforma
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center space-x-3 text-red-400 gradient-card p-4 rounded-lg border border-red-500/30 shadow-modern">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Input
                type="text"
                placeholder="Nome de Usuário"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                className="bg-gray-700/30 border-gray-600/50 text-white placeholder-gray-400 pl-12 py-3 rounded-xl focus:border-red-500 focus:ring-red-500/20 transition-all shadow-modern"
                required
                disabled={isLoading}
              />
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                placeholder="Token do Cartório"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setError('');
                }}
                className="bg-gray-700/30 border-gray-600/50 text-white placeholder-gray-400 pr-12 py-3 rounded-xl focus:border-red-500 focus:ring-red-500/20 transition-all shadow-modern"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowToken(!showToken)}
                disabled={isLoading}
              >
                {showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 text-lg shadow-modern btn-hover-lift disabled:opacity-50 rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Verificando...</span>
                </div>
              ) : (
                'Entrar na Plataforma'
              )}
            </Button>
          </form>
          
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full border-gray-600/50 text-gray-300 hover:bg-gray-700/30 hover:text-white py-3 shadow-modern btn-hover-lift glass-effect rounded-xl"
              onClick={handleDemo}
              disabled={isLoading}
            >
              Acessar Demonstração
            </Button>
            
            <div className="text-center">
              <Link 
                to="/admin-login"
                className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
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
