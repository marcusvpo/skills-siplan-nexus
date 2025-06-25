
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CartorioForm {
  nome: string;
  cnpj: string;
  email_contato: string;
  data_expiracao: string;
}

interface CartorioManagementProps {
  onTokenGenerated: () => void;
}

const CartorioManagement: React.FC<CartorioManagementProps> = ({ onTokenGenerated }) => {
  const [cartorioForm, setCartorioForm] = useState<CartorioForm>({
    nome: '',
    cnpj: '',
    email_contato: '',
    data_expiracao: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const generateCartorioToken = async () => {
    if (!cartorioForm.nome || !cartorioForm.cnpj || !cartorioForm.email_contato || !cartorioForm.data_expiracao) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Criar cartório
      const { data: cartorio, error: cartorioError } = await supabase
        .from('cartorios')
        .insert({
          nome: cartorioForm.nome,
          cnpj: cartorioForm.cnpj
        })
        .select()
        .single();

      if (cartorioError) throw cartorioError;

      // Gerar token único
      const loginToken = `CART-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Criar acesso
      const { error: acessoError } = await supabase
        .from('acessos_cartorio')
        .insert({
          login_token: loginToken,
          cartorio_id: cartorio.id,
          data_expiracao: cartorioForm.data_expiracao,
          email_contato: cartorioForm.email_contato,
          ativo: true
        });

      if (acessoError) throw acessoError;

      toast({
        title: "Token gerado com sucesso!",
        description: `Token: ${loginToken}`,
        duration: 10000,
      });

      // Reset form
      setCartorioForm({
        nome: '',
        cnpj: '',
        email_contato: '',
        data_expiracao: ''
      });

      // Notificar o componente pai para atualizar a lista
      onTokenGenerated();
    } catch (error) {
      console.error('Error generating token:', error);
      toast({
        title: "Erro ao gerar token",
        description: "Ocorreu um erro ao gerar o token.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Definir data padrão para 1 ano a partir de hoje
  React.useEffect(() => {
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    setCartorioForm(prev => ({
      ...prev,
      data_expiracao: oneYearFromNow.toISOString().split('T')[0]
    }));
  }, []);

  return (
    <Card className="bg-gray-800/50 border-gray-600 shadow-modern">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Plus className="h-5 w-5 mr-2 text-red-500" />
          Gerar Token para Cartório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nome" className="text-gray-300">Nome do Cartório</Label>
            <Input
              id="nome"
              value={cartorioForm.nome}
              onChange={(e) => setCartorioForm({...cartorioForm, nome: e.target.value})}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20"
              placeholder="Ex: Cartório de Registro Civil"
            />
          </div>
          <div>
            <Label htmlFor="cnpj" className="text-gray-300">CNPJ</Label>
            <Input
              id="cnpj"
              value={cartorioForm.cnpj}
              onChange={(e) => setCartorioForm({...cartorioForm, cnpj: e.target.value})}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20"
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-gray-300">Email de Contato</Label>
            <Input
              id="email"
              type="email"
              value={cartorioForm.email_contato}
              onChange={(e) => setCartorioForm({...cartorioForm, email_contato: e.target.value})}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20"
              placeholder="contato@cartorio.com.br"
            />
          </div>
          <div>
            <Label htmlFor="expiracao" className="text-gray-300">Data de Expiração</Label>
            <Input
              id="expiracao"
              type="date"
              value={cartorioForm.data_expiracao}
              onChange={(e) => setCartorioForm({...cartorioForm, data_expiracao: e.target.value})}
              className="bg-gray-700/50 border-gray-600 text-white focus:border-red-500 focus:ring-red-500/20"
            />
          </div>
        </div>
        <Button 
          onClick={generateCartorioToken}
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 hover:shadow-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando Token...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Gerar Token de Acesso
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CartorioManagement;
