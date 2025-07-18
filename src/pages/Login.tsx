
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, AlertCircle, User, RefreshCw, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    login_token: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirecionar se já está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 [Login] User already authenticated, redirecting...');
      if (user.type === 'admin') {
        navigate('/admin');
      } else if (user.type === 'cartorio') {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 [Login] Starting authentication process...');
    console.log('🔍 [Login] Form submit event triggered');
    
    try {
      console.log('🔍 [Login] Step 1: Preventing default form submission');
      e.preventDefault();
      
      console.log('🔍 [Login] Step 2: Checking form data validation');
      console.log('🔍 [Login] Username:', formData.username);
      console.log('🔍 [Login] Token length:', formData.login_token.length);
      
      if (!formData.username.trim() || !formData.login_token.trim()) {
        console.log('❌ [Login] Validation failed: empty fields');
        setError('Por favor, preencha todos os campos');
        return;
      }

      console.log('🔍 [Login] Step 3: Setting loading state to true');
      setIsLoading(true);
      console.log('🔍 [Login] Step 4: Clearing previous errors');
      setError('');

      console.log('🔍 [Login] Step 5: Preparing to call Supabase function');
      console.log('🔍 [Login] Supabase client:', !!supabase);
      console.log('🔍 [Login] Functions available:', !!supabase.functions);

      console.log('🔍 [Login] Step 6: Making Edge Function call with data:');
      console.log('🔍 [Login] - username:', formData.username);
      console.log('🔍 [Login] - login_token:', formData.login_token ? 'present' : 'missing');

      const { data, error: functionError } = await supabase.functions.invoke('login-cartorio', {
        body: {
          username: formData.username,
          login_token: formData.login_token
        }
      });

      console.log('🔍 [Login] Step 7: Edge Function response received');
      console.log('🔍 [Login] - data:', data);
      console.log('🔍 [Login] - error:', functionError);

      if (functionError) {
        console.error('❌ [Login] Edge Function error:', functionError);
        throw new Error(functionError.message || 'Erro na autenticação');
      }

      if (!data.success) {
        console.error('❌ [Login] Authentication failed:', data.message);
        throw new Error(data.message || 'Credenciais inválidas');
      }

      console.log('✅ [Login] Authentication successful:', data);

      console.log('🔍 [Login] Step 8: Calling login context method');
      login(formData.login_token, 'cartorio');

      console.log('🔍 [Login] Step 9: Preparing to redirect');
      navigate('/dashboard');

    } catch (err: any) {
      console.error('❌ [Login] Error in handleSubmit:', err);
      console.error('❌ [Login] Error stack:', err.stack);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      console.log('🔍 [Login] Step 10: Setting loading to false');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md shadow-2xl border border-gray-800 bg-gray-900/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-3 rounded-2xl shadow-lg shadow-red-500/20">
              <Settings className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
            Siplan Skills
          </CardTitle>
          <p className="text-center text-gray-400 text-sm">
            Acesse com suas credenciais do cartório
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-white">
                Usuário do Cartório
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Digite o usuário do cartório"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="pl-10 h-12 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="login_token" className="text-sm font-medium text-white">
                Token de Acesso
              </label>
              <div className="relative">
                <Input
                  id="login_token"
                  name="login_token"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Token do Cartório"
                  value={formData.login_token}
                  onChange={handleInputChange}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pr-10 focus:border-red-500 focus:ring-red-500/20 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
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
