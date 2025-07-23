import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextFixed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LoginFormData {
  username: string;
  login_token: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading: isAuthGlobalLoading, isAuthenticated, user, isAdmin } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    login_token: ''
  });
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Effect to redirect after successful authentication
  useEffect(() => {
    console.log('Login.tsx useEffect: Checking state for redirect. isAuthenticated:', isAuthenticated, 'user:', user, 'isAuthGlobalLoading:', isAuthGlobalLoading);

    // Don't redirect while still loading
    if (isAuthGlobalLoading) {
      console.log('Login.tsx: Still loading auth state, waiting...');
      return;
    }

    // Redirect if authenticated
    if (isAuthenticated && user) {
      console.log('✅ [Login Page] User authenticated, redirecting...', { userType: user.type, isAdmin });
      
      // Small delay to ensure state is fully settled
      setTimeout(() => {
        if (isAdmin) {
          console.log('🔄 [Login Page] Redirecting to admin dashboard');
          navigate('/admin');
        } else {
          console.log('🔄 [Login Page] Redirecting to user dashboard');
          navigate('/dashboard');
        }
      }, 100);
    }
  }, [isAuthenticated, user, isAdmin, navigate, isAuthGlobalLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormSubmitting(true);
    setError('');
    
    try {
      console.log(`ℹ️ [Login] Fazendo login direto para usuário: ${formData.username}`);
      await login(formData.username, 'cartorio', { token: formData.login_token, username: formData.username });
      console.log(`✅ [Login] Login direto bem-sucedido para ${formData.username}.`);
      
      setLoginSuccess(true);
      toast({
        title: "Login realizado",
        description: "Login efetuado com sucesso! Redirecionando...",
        duration: 3000,
      });

    } catch (err: any) {
      console.error('❌ [Login] Error in authentication flow:', err);
      setError(err.message || 'Login error. Please check your credentials.');
      toast({
        title: "Erro no Login",
        description: err.message || 'Verifique suas credenciais e tente novamente.',
        variant: "destructive",
      });
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Show loading screen while auth is being determined
  if (isAuthGlobalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 page-transition">
        <Card className="w-full max-w-md gradient-card shadow-elevated border-gray-600/50 card-enter">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white text-enhanced">Autenticando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't show login form if already authenticated (redirect will happen via useEffect)
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 page-transition">
        <Card className="w-full max-w-md gradient-card shadow-elevated border-gray-600/50 card-enter">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white text-enhanced">Redirecionando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 page-transition">
      <Card className="w-full max-w-md gradient-card shadow-elevated border-gray-600/50 card-enter">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/lovable-uploads/05a1d51a-f20d-4875-b8bc-f30942943e7d.png" 
              alt="Siplan Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-white text-enhanced">Login do Cartório</CardTitle>
          <p className="text-gray-300 mt-3 text-lg">
            Acesso exclusivo para cartórios
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-md p-3 text-red-200 text-sm">
              {error}
            </div>
          )}
          
          {loginSuccess ? (
            <div className="text-center space-y-4">
              <div className="bg-green-900/20 border border-green-500/50 rounded-md p-4 text-green-200 text-sm">
                Login efetuado com sucesso! Redirecionando para o dashboard...
              </div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  name="username"
                  placeholder="Nome de usuário"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="glass-effect border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20 transition-all shadow-modern"
                  disabled={isFormSubmitting}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="login_token"
                    placeholder="Token de Login"
                    value={formData.login_token}
                    onChange={handleInputChange}
                    className="glass-effect border-gray-600 text-white placeholder-gray-400 pr-10 focus:border-red-500 focus:ring-red-500/20 transition-all shadow-modern"
                    disabled={isFormSubmitting}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isFormSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 text-lg btn-hover-lift shadow-modern"
                disabled={isFormSubmitting}
              >
                {isFormSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Fazendo login...
                  </div>
                ) : (
                  'Fazer Login'
                )}
              </Button>
            </form>
          )}
          
          <div className="space-y-4 pt-4 border-t border-gray-700/50">
            <Link 
              to="/admin-login" 
              className="block text-center text-sm text-gray-400 hover:text-gray-300 transition-colors btn-hover-lift"
            >
              Acessar como Administrador
            </Link>
            
            <Link 
              to="/"
              className="flex items-center justify-center text-sm text-gray-400 hover:text-gray-300 transition-colors btn-hover-lift"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;