
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
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

      if (data.user) {
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
          <CardTitle className="text-3xl font-bold text-white text-enhanced">Painel Administrativo</CardTitle>
          <p className="text-gray-300 mt-3 text-lg">
            Acesso restrito a administradores
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-effect border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20 transition-all shadow-modern"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-effect border-gray-600 text-white placeholder-gray-400 pr-10 focus:border-red-500 focus:ring-red-500/20 transition-all shadow-modern"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 text-lg btn-hover-lift shadow-modern"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar no Painel'
              )}
            </Button>
          </form>
          
          <div className="space-y-4 pt-4 border-t border-gray-700/50">
            <Link 
              to="#"
              className="block text-center text-sm text-red-400 hover:text-red-300 transition-colors btn-hover-lift"
            >
              Esqueceu sua senha?
            </Link>
            
            <Link 
              to="/"
              className="flex items-center justify-center text-sm text-gray-400 hover:text-gray-300 transition-colors btn-hover-lift"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao início
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
