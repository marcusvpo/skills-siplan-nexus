
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const CartorioList: React.FC = () => {
  const { data: cartorios, isLoading } = useQuery({
    queryKey: ['cartorios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cartorios')
        .select(`
          *,
          acessos_cartorio (*)
        `)
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400 mr-3" />
        <span className="text-white">Carregando cartórios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cartorios?.map((cartorio) => (
        <Card key={cartorio.id} className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">{cartorio.nome}</CardTitle>
            {cartorio.cidade && cartorio.estado && (
              <p className="text-gray-400">{cartorio.cidade}, {cartorio.estado}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className={`px-2 py-1 rounded text-sm ${
                cartorio.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}>
                {cartorio.is_active ? 'Ativo' : 'Inativo'}
              </span>
              <span className="text-gray-400 text-sm">
                Token: {cartorio.acessos_cartorio?.[0]?.login_token ? 'Configurado' : 'Não configurado'}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
