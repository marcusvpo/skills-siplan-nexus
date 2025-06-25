
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
}

interface SystemFormProps {
  sistema?: Sistema | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SystemForm: React.FC<SystemFormProps> = ({
  sistema,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    nome: sistema?.nome || '',
    descricao: sistema?.descricao || '',
    ordem: sistema?.ordem || 1
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do sistema.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (sistema) {
        // Update existing system
        const { error } = await supabase
          .from('sistemas')
          .update({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null,
            ordem: formData.ordem
          })
          .eq('id', sistema.id);

        if (error) throw error;

        toast({
          title: "Sistema atualizado",
          description: `Sistema "${formData.nome}" foi atualizado com sucesso.`,
        });
      } else {
        // Create new system
        const { error } = await supabase
          .from('sistemas')
          .insert({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null,
            ordem: formData.ordem
          });

        if (error) throw error;

        toast({
          title: "Sistema criado",
          description: `Sistema "${formData.nome}" foi criado com sucesso.`,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving system:', error);
      toast({
        title: "Erro ao salvar sistema",
        description: "Ocorreu um erro ao salvar o sistema.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-600 shadow-modern">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">
          {sistema ? 'Editar Sistema' : 'Novo Sistema'}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome" className="text-gray-300">Nome do Sistema *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                placeholder="Ex: Sistema de Gestão"
                required
              />
            </div>
            <div>
              <Label htmlFor="ordem" className="text-gray-300">Ordem</Label>
              <Input
                id="ordem"
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })}
                className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                min="1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="descricao" className="text-gray-300">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
              placeholder="Descrição do sistema..."
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {sistema ? 'Atualizar' : 'Criar'} Sistema
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
