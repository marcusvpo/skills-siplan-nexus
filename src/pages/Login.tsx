
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleDemo = () => {
    setToken('DEMO-SIPLANSKILLS-CARTORIO');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting cartorio login with token:', token);
      
      // Call the login-cartorio edge function with correct full URL
      const response = await fetch('https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`,
        },
        body: JSON.stringify({ login_token: token }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok && data.success) {
        login(data.token, 'cartorio', {
          id: data.cartorio.id,
          name: data.cartorio.nome,
          cartorio_id: data.cartorio.id
        });
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo(a), ${data.cartorio.nome}!`,
        });
        
        navigate('/dashboard');
      } else {
        console.error('Login failed:', data);
        toast({
          title: "Token inválido",
          description: data.error || "Verifique seu token de acesso e tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">Siplan Skills</CardTitle>
          <p className="text-gray-400 mt-2">
            Insira seu token de acesso para continuar
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  placeholder="Insira seu Token de Acesso"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-10 focus:border-red-500 focus:ring-red-500"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg transition-all duration-200 hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar na Plataforma'}
            </Button>
          </form>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
              onClick={handleDemo}
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
