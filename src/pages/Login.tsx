import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextFixed'; // Importação corrigida para AuthContextFixed
import { Button } from '@/components/ui/button'; // Importações necessárias
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'; // Ícones necessários
import { toast } from '@/hooks/use-toast'; // Hook de toast

interface LoginFormData {
  username: string;
  login_token: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading: isAuthGlobalLoading } = useAuth(); // Pega o isLoading global do AuthContext
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    login_token: ''
  });
  const [isFormSubmitting, setIsFormSubmitting] = useState(false); // Estado local para o formulário
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar senha

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
      console.log('🔍 [Login] Chamando método de login...');
      // A função login do AuthContextFixed já lida com o isLoading global
      await login(formData.username, 'cartorio', { token: formData.login_token }); 
      console.log('✅ [Login] Autenticação bem-sucedida (aguardando redirecionamento do AuthContext)');
      // O redirecionamento será tratado pelo useEffect em AuthContextFixed.tsx
      // Não navegamos aqui diretamente para evitar corrida de dados.
    } catch (err: any) {
      console.error('❌ [Login] Erro de autenticação:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
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
                type="text" // Alterado para text pois username pode não ser email
                placeholder="Nome de usuário"
                value={formData.username}
                onChange={handleInputChange}
                className="glass-effect border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20 transition-all shadow-modern"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Token de Login"
                  value={formData.login_token}
                  onChange={handleInputChange}
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