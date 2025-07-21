import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextFixed'; // Importação corrigida para AuthContextFixed
import { Button } from '@/components/ui/button'; // Importações necessárias
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'; // Ícones necessários
import { toast } from '@/hooks/use-toast'; // Hook de toast
import { supabase } from '@/integrations/supabase/client'; // Importação do cliente Supabase para login direto

interface LoginFormData {
  username: string;
  login_token: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  // Pega o isLoading global do AuthContextFixed e outras informações do usuário
  const { login, isLoading: isAuthGlobalLoading, isAuthenticated, user, isAdmin } = useAuth(); 
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    login_token: ''
  });
  const [isFormSubmitting, setIsFormSubmitting] = useState(false); // Estado local para o formulário
  const [error, setError] = useState(''); // Limpa erros anteriores
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar senha

  // --- CONSTANTES DO USUÁRIO DE CONTORNO (test.user) ---
  // Utilize os valores REAIS que você copiou do Passo 1.
  const USUARIO_CONTORNO_USERNAME = 'test.user'; 
  const ID_DO_CARTORIO_DO_TEST_USER = '6bee8971-43ab-4e11-9f4e-558242227cbb'; 
  const ID_DO_USUARIO_TEST_USER = '3e0cba60-99d1-4e04-a74c-730fb918aee5'; 

  // --- FUNÇÃO AUXILIAR PARA GERAR SHA-256 NO FRONTEND ---
  async function gerarSha256Frontend(str: string): Promise<string> {
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hexHash;
  }

  // Efeito para redirecionar após autenticação bem-sucedida
  useEffect(() => {
    if (isAuthGlobalLoading) {
      // Ainda carregando o estado inicial de autenticação, não redirecionar ainda
      return; 
    }

    if (isAuthenticated && user) {
      console.log('✅ [Login Page] Usuário autenticado, redirecionando...');
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
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
    setIsFormSubmitting(true); // Ativa o loading do formulário
    setError(''); // Limpa erros anteriores
    
    try {
      // --- LÓGICA DE CONTORNO: LOGIN DIRETO PARA test.user ---
      if (formData.username === USUARIO_CONTORNO_USERNAME) {
        console.log(`ℹ️ [Login] Tentando login direto para ${USUARIO_CONTORNO_USERNAME}`);

        const emailParaLogin = `${USUARIO_CONTORNO_USERNAME.toLowerCase()}@${ID_DO_CARTORIO_DO_TEST_USER.replace(/-/g, '')}.siplan.internal`;
        const stringParaHash = `${ID_DO_CARTORIO_DO_TEST_USER}-${ID_DO_USUARIO_TEST_USER}`;
        const senhaParaLogin = await gerarSha256Frontend(stringParaHash);

        // Chamar a API de autenticação do Supabase diretamente
        const { data: authResponse, error: authError } = await supabase.auth.signInWithPassword({
          email: emailParaLogin,
          password: senhaParaLogin,
        });

        if (authError) {
          console.error('❌ [Login] Erro no login direto:', authError);
          setError(authError.message || 'Credenciais inválidas para o usuário de contorno.');
          return; // Sair da função se houver erro
        }
        
        // Se o login direto for bem-sucedido, o AuthContextFixed detectará a sessão
        // e o useEffect cuidará do redirecionamento.
        console.log(`✅ [Login] Login direto de ${USUARIO_CONTORNO_USERNAME} bem-sucedido.`);
        return; // Sair da função, pois o login foi tratado
      }

      // --- LÓGICA EXISTENTE: LOGIN COM A EDGE FUNCTION PARA OUTROS USUÁRIOS ---
      // Esta parte será executada se o username NÃO for 'test.user'.
      // Esta lógica continuará chamando sua Edge Function 'login-cartorio'.
      console.log(`ℹ️ [Login] Chamando Edge Function para usuário: ${formData.username}`);
      // A função 'login' do seu AuthContextFixed já lida com o isLoading global e a chamada à Edge Function
      await login(formData.username, 'cartorio', { token: formData.login_token, username: formData.username }); 
      console.log(`✅ [Login] Autenticação via Edge Function bem-sucedida para ${formData.username} (aguardando redirecionamento)`);

    } catch (err: any) {
      console.error('❌ [Login] Erro no fluxo de autenticação:', err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsFormSubmitting(false); // Desativa o loading do formulário
    }
  };

  // Se o carregamento global de autenticação estiver ativo, mostra "Autenticando..."
  // Isso cobre a verificação inicial e o tempo que leva para o AuthContext processar o login.
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

  // Se já está autenticado, não mostra o formulário de login. O useEffect acima fará o redirecionamento.
  if (isAuthenticated && user) {
    return null; // ou um spinner, se preferir
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                name="username"
                placeholder="Nome de usuário"
                value={formData.username}
                onChange={handleInputChange}
                className="glass-effect border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20 transition-all shadow-modern"
                disabled={isFormSubmitting} // Desabilita o campo durante a submissão
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
                  disabled={isFormSubmitting} // Desabilita o campo durante a submissão
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isFormSubmitting} // Desabilita o botão durante a submissão
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 text-lg btn-hover-lift shadow-modern"
              disabled={isFormSubmitting} // Desabilita o botão apenas durante a submissão do formulário
            >
              {isFormSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar na Plataforma'
              )}
            </Button>
          </form>
          
          <div className="space-y-4 pt-4 border-t border-gray-700/50">
            <Link 
              to="/admin-login" // Link para o login de admin
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