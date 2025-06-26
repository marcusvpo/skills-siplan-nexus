
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Eye, EyeOff, AlertCircle, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting cartorio login with username:', username, 'and token:', token);
      
      const response = await fetch('https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`,
        },
        body: JSON.stringify({ username, login_token: token }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro de conexão' }));
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Login response:', data);

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
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
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
              <AlertCircle className="h-4 w-4" />
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
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowToken(!showToken)}
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
              {isLoading ? 'Verificando...' : 'Entrar na Plataforma'}
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
