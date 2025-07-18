import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, AlertCircle, User, RefreshCw, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      logger.userAction('Login attempt started', { username, hasToken: !!token });
      
      console.log('🔍 [LOGIN] Iniciando chamada para Edge Function...');
      
      // URL dinâmica baseada no ambiente atual
      const baseUrl = window.location.origin.includes('lovable.app') 
        ? 'https://bnulocsnxiffavvabfdj.supabase.co'
        : 'https://bnulocsnxiffavvabfdj.supabase.co';
      
      const response = await fetch(`${baseUrl}/functions/v1/login-cartorio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`,
        },
        body: JSON.stringify({ username, login_token: token }),
      });

      console.log('🔍 [LOGIN] Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [LOGIN] Erro HTTP:', errorText);
        throw new Error(`Erro do servidor: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [LOGIN] Resposta recebida:', data);

      logger.info('Login response received', { status: response.status });

      if (data.success && data.access_token && data.refresh_token) {
        console.log('✅ [LOGIN] Login bem-sucedido, configurando sessão...');
        
        await login(
          'cartorio-session', // Token legacy para compatibilidade
          'cartorio', 
          {
            id: data.usuario.id,
            name: data.usuario.username,
            cartorio_id: data.cartorio.id,
            cartorio_name: data.cartorio.nome,
            username: data.usuario.username,
            email: data.usuario.email
          },
          data.access_token,
          data.refresh_token
        );
        
        toast({
          title: "Login realizado com sucesso!",
          description: data.message || `Bem-vindo(a), ${data.usuario.username}!`,
        });
        
        navigate('/dashboard');
      } else {
        console.error('❌ [LOGIN] Estrutura de resposta inválida:', data);
        throw new Error(data.error || 'Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('💥 [LOGIN] Erro capturado:', error);
      logger.error('Login error', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Mapear erros para mensagens amigáveis
      let friendlyMessage = errorMessage;
      if (errorMessage.includes('USER_NOT_FOUND')) {
        friendlyMessage = 'Usuário não encontrado ou inativo.';
      } else if (errorMessage.includes('INVALID_TOKEN')) {
        friendlyMessage = 'Token inválido, expirado ou inativo.';
      } else if (errorMessage.includes('SESSION_ERROR')) {
        friendlyMessage = 'Erro ao criar sessão. Tente novamente.';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#1a1a1a] to-gray-800 flex items-center justify-center p-4 relative">
      <Link 
        to="/admin-login"
        className="absolute top-4 right-4 flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-400 transition-colors"
      >
        <Settings className="h-3 w-3" />
        <span>Admin</span>
      </Link>

      <Card className="w-full max-w-md bg-gray-800/80 border-gray-600 shadow-modern backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/lovable-uploads/05a1d51a-f20d-4875-b8bc-f30942943e7d.png" 
              alt="Siplan Logo" 
              className="h-12 w-auto object-contain"
            />
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
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 text-xl font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Autenticando...</span>
                </div>
              ) : (
                'Acessar Plataforma'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;