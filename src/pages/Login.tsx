import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextFixed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, KeyRound, Loader2, Settings, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AuthShell } from '@/components/auth/AuthShell';
import { AmbientBackdrop } from '@/components/layout/AmbientBackdrop';

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

  const StatusScreen = ({ label }: { label: string }) => (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AmbientBackdrop />
      <div className="relative z-10 flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/70 px-10 py-8 backdrop-blur-xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
    </div>
  );

  // Show loading screen while auth is being determined
  if (isAuthGlobalLoading) {
    return <StatusScreen label="Autenticando..." />;
  }

  // Don't show login form if already authenticated (redirect will happen via useEffect)
  if (isAuthenticated && user) {
    return <StatusScreen label="Redirecionando..." />;
  }

  return (
    <AuthShell
      eyebrow="Acesso do cartório"
      title="Login do Cartório"
      subtitle="Use o usuário e o token de acesso fornecidos pela equipe Siplan."
      topRight={
        <Link
          to="/admin-login"
          className="group flex items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-3 py-2 backdrop-blur-md transition-colors hover:border-primary/50"
        >
          <Settings className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
            Admin
          </span>
        </Link>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
            {error}
          </div>
        )}

        {loginSuccess ? (
          <div className="space-y-4 text-center">
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
              Login efetuado com sucesso! Redirecionando para o dashboard...
            </div>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Usuário
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="nome.do.cartorio"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="h-11 border-border/60 bg-background/50 pl-10 backdrop-blur-sm transition-all placeholder:text-muted-foreground focus-visible:border-primary/60"
                  disabled={isFormSubmitting}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login_token" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Token de acesso
              </Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login_token"
                  type={showPassword ? 'text' : 'password'}
                  name="login_token"
                  placeholder="CART00000000000000"
                  value={formData.login_token}
                  onChange={handleInputChange}
                  className="h-11 border-border/60 bg-background/50 pl-10 pr-11 font-mono text-sm backdrop-blur-sm transition-all placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-primary/60"
                  disabled={isFormSubmitting}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar token' : 'Mostrar token'}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isFormSubmitting}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="glow" size="lg" className="w-full" disabled={isFormSubmitting}>
              {isFormSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fazendo login...
                </>
              ) : (
                'Entrar na plataforma'
              )}
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
};

export default Login;