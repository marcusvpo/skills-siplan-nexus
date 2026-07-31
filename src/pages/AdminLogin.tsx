
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return; // Prevenir múltiplas submissões
    
    setIsLoading(true);
    console.log('🔍 DEBUG: Admin login form submitted');

    try {
      console.log('🔍 DEBUG: Attempting admin login with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔍 DEBUG: Supabase auth result:', { 
        hasData: !!data, 
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error ? error.message : null 
      });

      if (error) {
        console.log('🔍 DEBUG: Supabase auth error:', error);
        toast({
          title: "Credenciais inválidas",
          description: error.message || "Email ou senha incorretos.",
          variant: "destructive",
        });
        return;
      }

      if (data.user && data.session) {
        console.log('🔍 DEBUG: User authenticated, checking admin status for:', data.user.email);
        
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('email', data.user.email)
          .single();

        console.log('🔍 DEBUG: Admin check result:', { 
          hasAdminData: !!adminData, 
          adminError: adminError ? adminError.message : null,
          adminData 
        });

        if (adminError || !adminData) {
          console.log('🔍 DEBUG: User is not an admin:', adminError);
          await supabase.auth.signOut();
          toast({
            title: "Acesso negado",
            description: "Usuário não tem permissões administrativas.",
            variant: "destructive",
          });
          return;
        }

        console.log('🔍 DEBUG: Admin login successful for:', adminData.nome);
        
        toast({
          title: "Login administrativo realizado!",
          description: `Bem-vindo(a), ${adminData.nome}!`,
        });
        
        console.log('🔍 DEBUG: Navigating to /admin');
        navigate('/admin');
      }
    } catch (error) {
      console.log('🔍 DEBUG: Login catch error:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      console.log('🔍 DEBUG: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  console.log('🔍 DEBUG: AdminLogin render - isLoading:', isLoading);

  return (
    <AuthShell
      eyebrow="Acesso restrito"
      title="Painel Administrativo"
      subtitle="Gestão de cartórios, conteúdo e acessos da plataforma Siplan Skills."
      topRight={
        <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-xs font-medium text-muted-foreground backdrop-blur-md">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Área administrativa
        </span>
      }
      footer={
        <Link
          to="#"
          className="block text-center text-sm text-primary transition-colors hover:text-primary/80"
        >
          Esqueceu sua senha?
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="admin-email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            E-mail
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@siplan.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 border-border/60 bg-background/50 pl-10 backdrop-blur-sm transition-all placeholder:text-muted-foreground focus-visible:border-primary/60"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Senha
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border-border/60 bg-background/50 pl-10 pr-11 backdrop-blur-sm transition-all placeholder:text-muted-foreground focus-visible:border-primary/60"
              required
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" variant="glow" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar no Painel'
          )}
        </Button>
      </form>
    </AuthShell>
  );
};

export default AdminLogin;
