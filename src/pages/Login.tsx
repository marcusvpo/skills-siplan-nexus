
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, AlertCircle, User, RefreshCw, Settings, Trash2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Função para limpar todo o estado de autenticação
  const clearAuthState = async () => {
    try {
      console.log('🧹 [Login] Limpando estado de autenticação...');
      
      // Limpar localStorage
      localStorage.removeItem('sb-cartorio-auth-token');
      localStorage.removeItem('supabase.auth.token');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.') || key.startsWith('sb-') || key.startsWith('video_timer_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Limpar sessionStorage
      sessionStorage.clear();
      
      // Fazer logout do Supabase
      await supabase.auth.signOut();
      
      // Limpar campos do formulário
      setUsername('');
      setToken('');
      setError('');
      
      toast({
        title: "Cache limpo",
        description: "Estado de autenticação foi resetado",
      });
      
      console.log('✅ [Login] Estado limpo com sucesso');
      
      // Pequeno delay antes de recarregar
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('❌ [Login] Erro ao limpar estado:', error);
      toast({
        title: "Erro",
        description: "Erro ao limpar cache. Recarregue a página manualmente.",
        variant: "destructive",
      });
    }
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
      logger.info('Login successful', { 
        cartorio: data.cartorio_data?.nome,
        usuario: data.app_user_data?.username
      });

      if (data.success && data.access_token && data.refresh_token) {
        console.log("✅ [Login] Recebidos tokens do Supabase Auth");
        
        // CONFIGURAR SESSÃO SUPABASE COM TOKENS REAIS
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (setSessionError) {
          console.error("❌ [Login] Erro ao configurar a sessão Supabase:", setSessionError);
          throw new Error('Erro ao configurar sessão de autenticação');
        }

        console.log("✅ [Login] Sessão Supabase configurada com sucesso");
        
        // Configurar contexto de autenticação customizado
        await login(data.access_token, 'cartorio', {
          id: data.app_user_data.id,
          name: data.app_user_data.username,
          cartorio_id: data.cartorio_data.id,
          cartorio_name: data.cartorio_data.nome,
          username: data.app_user_data.username
        });
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo(a), ${data.app_user_data.username} - ${data.cartorio_data.nome}!`,
        });
        
        navigate('/dashboard');
      } else {
        throw new Error(data.error || 'Resposta inválida do servidor');
      }
    } catch (error) {
      logger.error('Login error', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Mapear códigos de erro para mensagens mais amigáveis
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#1a1a1a] to-gray-800 flex items-center justify-center p-4 relative">
      {/* Acesso Administrativo - posição discreta no canto superior direito */}
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
          {/* Botão de Debug para Limpar Cache */}
          <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-400 font-medium">Debug</p>
                <p className="text-xs text-gray-400">Limpar cache se estiver com problemas</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAuthState}
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            </div>
          </div>

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
            
            {/* Botão principal centralizado e destacado */}
            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 text-xl font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Verificando...</span>
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
