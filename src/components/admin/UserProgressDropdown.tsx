import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { BarChart3, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

interface UserProgressDropdownProps {
  cartorioId: string;
  cartorioName: string;
}

interface ProductProgress {
  produto_id: string;
  produto_nome: string;
  total_aulas: number;
  aulas_concluidas: number;
  percentual: number;
}

export const UserProgressDropdown: React.FC<UserProgressDropdownProps> = ({
  cartorioId,
  cartorioName
}) => {
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['user-progress', cartorioId],
    queryFn: async () => {
      console.log('🔍 [UserProgressDropdown] Fetching progress for cartorio:', cartorioId);
      
      // Buscar progresso por produto para o cartório
      const { data: progressQuery, error } = await supabase
        .from('produtos')
        .select(`
          id,
          nome,
          video_aulas!inner(
            id,
            visualizacoes_cartorio!left(
              completo,
              cartorio_id
            )
          )
        `);

      if (error) {
        console.error('❌ [UserProgressDropdown] Error fetching progress:', error);
        throw error;
      }

      // Processar dados para calcular progresso
      const progressos: ProductProgress[] = progressQuery.map(produto => {
        const totalAulas = produto.video_aulas.length;
        const aulasCompletas = produto.video_aulas.filter(aula => 
          aula.visualizacoes_cartorio.some(viz => 
            viz.cartorio_id === cartorioId && viz.completo === true
          )
        ).length;

        const percentual = totalAulas > 0 ? Math.round((aulasCompletas / totalAulas) * 100) : 0;

        return {
          produto_id: produto.id,
          produto_nome: produto.nome,
          total_aulas: totalAulas,
          aulas_concluidas: aulasCompletas,
          percentual
        };
      });

      console.log('✅ [UserProgressDropdown] Progress calculated:', progressos);
      return progressos;
    },
    enabled: !!cartorioId
  });

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Carregando...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart3 className="h-4 w-4 mr-2" />
          Ver Progresso
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>
          Progresso - {cartorioName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {progressData && progressData.length > 0 ? (
          progressData.map(produto => (
            <DropdownMenuItem key={produto.produto_id} className="flex-col items-start p-3 space-y-2">
              <div className="flex justify-between w-full">
                <span className="font-medium text-sm">{produto.produto_nome}</span>
                <span className="text-xs text-muted-foreground">
                  {produto.aulas_concluidas}/{produto.total_aulas}
                </span>
              </div>
              
              <div className="w-full">
                <Progress value={produto.percentual} className="h-2" />
              </div>
              
              <div className="flex justify-between w-full text-xs">
                <span className="text-muted-foreground">
                  {produto.percentual}% concluído
                </span>
                <span className="text-muted-foreground">
                  {produto.total_aulas - produto.aulas_concluidas} restantes
                </span>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem className="text-center p-4">
            <span className="text-muted-foreground">
              Nenhum progresso encontrado
            </span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};