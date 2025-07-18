import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Importa useAuth da versão FIXA
import { useAuth } from '@/contexts/AuthContextFixed'; 
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User, Database, CheckCircle } from 'lucide-react';

// Removido o 'export' aqui, pois já estará no final
const AuthDebugPanel: React.FC = () => { // AGORA DEFINIDO SEM 'export' AQUI
  const { user, isAuthenticated, login, logout } = useAuth();
  const [isTestingLogin, setIsTestingLogin] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const handleTestCartorioLogin = async () => {
    setIsTestingLogin(true);
    try {
      // Simular login de cartório com dados reais dos logs
      // A função login agora espera o username como primeiro argumento, e o objeto user data como terceiro
      // o login_token é passado dentro do userData
      await login('user.test', 'cartorio', { 
        id: 'mock-user-id', // ID mock para o user local do AuthContext
        name: 'Cartório Teste Final', 
        cartorio_id: '6bee8971-43ab-4e11-9f4e-558242227cbb', 
        cartorio_name: 'Cartório Teste Final', 
        username: 'user.test', 
        email: 'x@x.com', // Este email deve ser o mesmo usado para o Supabase Auth
        token: 'CART-1751554048539-2H6W7O' // O token real para a Edge Function
      });
      
      toast({
        title: "Login de demonstração realizado",
        description: "Usuário de demonstração logado com sucesso",
      });
    } catch (error) {
      console.error('Erro no login de demonstração:', error);
      toast({
        title: "Erro no login",
        description: "Falha ao fazer login de demonstração",
        variant: "destructive"
      });
    } finally {
      setIsTestingLogin(false);
    }
  };

  const handleTestDatabase = async () => {
    try {
      // Testar conexão com banco de dados
      const { data: sistemas, error } = await supabase
        .from('sistemas')
        .select('id, nome')
        .limit(1);

      if (error) {
        throw error;
      }

      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('id, nome, sistema_id')
        .limit(1);

      if (produtosError) {
        throw produtosError;
      }

      const { data: videoAulas, error: videoAulasError } = await supabase
        .from('video_aulas')
        .select('id, titulo, produto_id')
        .limit(1);

      if (videoAulasError) {
        throw videoAulasError;
      }

      const { data: visualizacoes, error: visualizacoesError } = await supabase
        .from('visualizacoes_cartorio')
        .select('id, cartorio_id, video_aula_id, completo')
        .limit(1);

      if (visualizacoesError) {
        throw visualizacoesError;
      }

      setTestResults({
        sistemas: sistemas?.length || 0,
        produtos: produtos?.length || 0,
        videoAulas: videoAulas?.length || 0,
        visualizacoes: visualizacoes?.length || 0
      });

      toast({
        title: "Teste de banco concluído",
        description: "Conexão com banco de dados está funcionando",
      });
    } catch (error) {
      console.error('Erro no teste de banco:', error);
      toast({
        title: "Erro no banco",
        description: "Falha ao conectar com banco de dados",
        variant: "destructive"
      });
    }
  };

  const handleTestProgress = async () => {
    if (!user?.cartorio_id) {
      toast({
        title: "Usuário não autenticado",
        description: "Faça login primeiro",
        variant: "destructive"
      });
      return;
    }

    try {
      // Testar função de progresso
      const { data, error } = await supabase.rpc('get_product_progress', {
        p_produto_id: 'test-produto-id',
        p_cartorio_id: user.cartorio_id
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Teste de progresso concluído",
        description: "Função de progresso está funcionando",
      });
    } catch (error) {
      console.error('Erro no teste de progresso:', error);
      toast({
        title: "Erro no progresso",
        description: "Falha ao testar função de progresso",
        variant: "destructive"
      });
    }
  };

  const handleTestContext = async () => {
    if (!user?.cartorio_id) {
      toast({
        title: "Usuário não autenticado",
        description: "Faça login primeiro",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🔧 [AuthDebugPanel] Testando contexto do cartório...');
      
      // Setar o contexto
      const { error: setError } = await supabase.rpc('set_cartorio_context', {
        p_cartorio_id: user.cartorio_id
      });

      if (setError) {
        console.error('❌ [AuthDebugPanel] Erro ao setar contexto:', setError);
        throw setError;
      }

      console.log('✅ [AuthDebugPanel] Contexto setado com sucesso');

      // Verificar se o contexto foi setado usando a função de teste
      const { data: contextTest, error: contextTestError } = await supabase.rpc('test_cartorio_context');
      
      if (contextTestError) {
        console.error('❌ [AuthDebugPanel] Erro ao testar contexto:', contextTestError);
      } else {
        console.log('✅ [AuthDebugPanel] Teste de contexto:', contextTest);
      }

      // Verificar se o contexto foi setado corretamente
      const { data: currentCartorioId, error: getError } = await supabase.rpc('get_current_cartorio_id_from_jwt');

      if (getError) {
        console.error('❌ [AuthDebugPanel] Erro ao obter contexto:', getError);
        throw getError;
      }

      console.log('✅ [AuthDebugPanel] Contexto obtido após setar:', currentCartorioId);

      // Testar função de registrar visualização
      const { data: testResult, error: testError } = await supabase.rpc('registrar_visualizacao_cartorio_robust', {
        p_video_aula_id: 'ac602288-2fea-49cb-b877-2c4e60325f4b', // ID de video conhecido dos logs
        p_completo: true,
        p_concluida: true,
        p_data_conclusao: new Date().toISOString()
      });

      if (testError) {
        console.error('❌ [AuthDebugPanel] Erro ao testar visualização:', testError);
        throw testError;
      }

      console.log('✅ [AuthDebugPanel] Teste de visualização concluído:', testResult);

      toast({
        title: "Teste de contexto concluído",
        description: "Contexto do cartório está funcionando",
      });
    } catch (error) {
      console.error('❌ [AuthDebugPanel] Erro no teste de contexto:', error);
      toast({
        title: "Erro no contexto",
        description: "Falha ao testar contexto do cartório",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Debug de Autenticação e Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status de Autenticação */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Status de Autenticação</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? "Autenticado" : "Não Autenticado"}
              </Badge>
            </div>
            {user && (
              <div className="text-sm space-y-1">
                <p><strong>Nome:</strong> {user.name}</p>
                <p><strong>Tipo:</strong> {user.type}</p>
                <p><strong>Cartório ID:</strong> {user.cartorio_id || 'N/A'}</p>
                <p><strong>Email:</strong> {user.email || 'N/A'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Testes de Banco */}
        {testResults && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Resultados do Teste de Banco
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>Sistemas: {testResults.sistemas}</p>
              <p>Produtos: {testResults.produtos}</p>
              <p>Video Aulas: {testResults.videoAulas}</p>
              <p>Visualizações: {testResults.visualizacoes}</p>
            </div>
          </div>
        )}

        {/* Botões de Teste */}
        <div className="space-y-2">
          <Button 
            onClick={handleTestCartorioLogin}
            disabled={isTestingLogin}
            className="w-full"
          >
            {isTestingLogin ? "Fazendo Login..." : "Testar Login de Demonstração"}
          </Button>

          <Button 
            onClick={handleTestDatabase}
            variant="outline"
            className="w-full"
          >
            <Database className="h-4 w-4 mr-2" />
            Testar Conexão com Banco
          </Button>

          <Button 
            onClick={handleTestProgress}
            variant="outline"
            className="w-full"
            disabled={!isAuthenticated}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Testar Função de Progresso
          </Button>

          <Button 
            onClick={handleTestContext}
            variant="outline"
            className="w-full"
            disabled={!isAuthenticated}
          >
            <User className="h-4 w-4 mr-2" />
            Testar Contexto do Cartório
          </Button>

          {isAuthenticated && (
            <Button 
              onClick={logout}
              variant="destructive"
              className="w-full"
            >
              Fazer Logout
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
// Adicionada a linha de exportação correta aqui no final do arquivo
export { AuthDebugPanel }; 