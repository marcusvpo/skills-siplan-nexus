
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
      console.log('🔍 [LOGIN] URL:', 'https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio');
      console.log('🔍 [LOGIN] Payload:', { username, login_token: token });
      
      const response = await fetch('https://bnulocsnxiffavvabfdj.supabase.co/functions/v1/login-cartorio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudWxvY3NueGlmZmF2dmFiZmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzM1NTMsImV4cCI6MjA2NjQ0OTU1M30.3QeKQtbvTN4KQboUKhqOov16HZvz-xVLxmhl70S2IAE`,
        },
        body: JSON.stringify({ username, login_token: token }),
      });

      console.log('🔍 [LOGIN] Resposta recebida:');
      console.log('  - Status:', response.status);
      console.log('  - StatusText:', response.statusText);
      console.log('  - Headers:', Object.fromEntries(response.headers.entries()));
      
      // Clone response para poder ler o texto múltiplas vezes
      const responseClone = response.clone();
      const responseText = await responseClone.text();
      console.log('🔍 [LOGIN] Corpo da resposta (texto):', responseText);

      logger.info('Login response received', { status: response.status });
      
      if (!response.ok) {
        console.error('❌ [LOGIN] Response não OK:', response.status);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ [LOGIN] Erro ao parsear JSON de erro:', parseError);
          errorData = { 
            error: `Erro HTTP ${response.status}: ${responseText}`,
            code: 'HTTP_ERROR'
          };
        }
        
        logger.error('Login failed', { error: errorData, status: response.status });
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      // Tentar parsear JSON da resposta de sucesso
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ [LOGIN] JSON parseado com sucesso:', data);
      } catch (parseError) {
        console.error('❌ [LOGIN] Erro ao parsear JSON de sucesso:', parseError);
        console.error('❌ [LOGIN] Resposta que falhou no parse:', responseText);
        throw new Error(`Resposta inválida do servidor - não é JSON válido: ${responseText.substring(0, 200)}`);
      }

      logger.info('Login successful', { 
        cartorio: data.cartorio?.nome,
        usuario: data.usuario?.username
      });

      // Verificar estrutura da resposta
      console.log('🔍 [LOGIN] Verificando estrutura da resposta:');
      console.log('  - data.success:', data.success);
      console.log('  - data.access_token:', data.access_token ? 'PRESENTE' : 'AUSENTE');
      console.log('  - data.refresh_token:', data.refresh_token ? 'PRESENTE' : 'AUSENTE');
      console.log('  - data.cartorio:', data.cartorio ? 'PRESENTE' : 'AUSENTE');
      console.log('  - data.usuario:', data.usuario ? 'PRESENTE' : 'AUSENTE');

      if (data.success && data.access_token && data.refresh_token && data.cartorio && data.usuario) {
        console.log('✅ [LOGIN] Estrutura válida, prosseguindo com login...');
        
        await login(
          'legacy-token', // Token customizado legacy (pode ser removido no futuro)
          'cartorio', 
          {
            id: data.usuario.id,
            name: data.usuario.username,
            cartorio_id: data.cartorio.id,
            cartorio_name: data.cartorio.nome,
            username: data.usuario.username,
            email: data.usuario.email
          },
          data.access_token,  // ✅ Token de acesso real do Supabase
          data.refresh_token  // ✅ Token de refresh real do Supabase
        );
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo(a), ${data.usuario.username} - ${data.cartorio.nome}!`,
        });
        
        navigate('/dashboard');
      } else {
        console.error('❌ [LOGIN] Estrutura inválida da resposta:');
        console.error('  - Campos faltando:', {
          success: !data.success,
          access_token: !data.access_token,
          refresh_token: !data.refresh_token,
          cartorio: !data.cartorio,
          usuario: !data.usuario
        });
        throw new Error(data.error || 'Resposta inválida do servidor - campos obrigatórios ausentes');
      }
    } catch (error) {
      console.error('💥 [LOGIN] Erro capturado:', error);
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
