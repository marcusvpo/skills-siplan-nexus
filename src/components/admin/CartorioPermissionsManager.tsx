
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Save, RefreshCw, AlertCircle, ChevronDown, ChevronRight, BookOpen, Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { PermissionsTree } from './PermissionsTree';

interface CartorioPermissionsManagerProps {
  cartorio: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const CartorioPermissionsManager: React.FC<CartorioPermissionsManagerProps> = ({
  cartorio,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [todosOsSistemas, setTodosOsSistemas] = useState<any[]>([]);
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<Set<string>>(new Set());
  const [sistemasExpandidos, setSistemasExpandidos] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar todos os sistemas com produtos e videoaulas para contagem
      const { data: sistemas, error: sistemasError } = await supabase
        .from('sistemas')
        .select(`
          *,
          produtos (
            *,
            video_aulas (*)
          )
        `)
        .order('ordem');

      if (sistemasError) {
        throw new Error(`Erro ao buscar sistemas: ${sistemasError.message}`);
      }

      setTodosOsSistemas(sistemas || []);

      // Buscar permissões atuais
      const { data: permissoes, error: permissoesError } = await supabase
        .from('cartorio_acesso_conteudo')
        .select('*')
        .eq('cartorio_id', cartorio.id)
        .eq('ativo', true);

      if (permissoesError) {
        throw new Error(`Erro ao buscar permissões: ${permissoesError.message}`);
      }

      logger.info('🔐 [CartorioPermissionsManager] Permissões encontradas:', { permissoes });

      // Configurar seleções baseado nas permissões existentes
      const selected = new Set<string>();
      const expandidos = new Set<string>();
      permissoes?.forEach((p: any) => {
        if (p.sistema_id && !p.produto_id) {
          selected.add(`sistema-${p.sistema_id}`);
          expandidos.add(p.sistema_id);
        } else if (p.produto_id) {
          selected.add(`produto-${p.produto_id}`);
          const sistemaDoProduto = (sistemas || []).find((s: any) =>
            s.produtos?.some((prod: any) => prod.id === p.produto_id)
          );
          if (sistemaDoProduto) {
            expandidos.add(sistemaDoProduto.id);
          }
        }
      });
      
      logger.info('🔐 [CartorioPermissionsManager] Seleções configuradas:', { selected: Array.from(selected) });
      setPermissoesSelecionadas(selected);
      setSistemasExpandidos(expandidos);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: "Erro ao carregar permissões",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      logger.info('🔐 [CartorioPermissionsManager] Salvando permissões para cartório:', { 
        cartorioId: cartorio.id,
        permissoes: Array.from(permissoesSelecionadas)
      });

      // Preparar array de permissões no formato correto - CRITICAL FIX
      const permissoes: any[] = [];
      
      permissoesSelecionadas.forEach(selection => {
        const [tipo, ...idParts] = selection.split('-');
        const fullId = idParts.join('-'); // Reconstrói o UUID completo
        
        // CRITICAL UUID VALIDATION
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (tipo === 'sistema' && fullId && uuidRegex.test(fullId)) {
          permissoes.push({
            sistema_id: fullId,
            produto_id: null
          });
          logger.info('🔐 [CartorioPermissionsManager] Sistema válido:', { sistemaId: fullId });
        } else if (tipo === 'produto' && fullId && uuidRegex.test(fullId)) {
          permissoes.push({
            sistema_id: null,
            produto_id: fullId
          });
          logger.info('🔐 [CartorioPermissionsManager] Produto válido:', { produtoId: fullId });
        } else {
          logger.warn('🔐 [CartorioPermissionsManager] ID inválido ignorado:', { tipo, fullId, selection });
        }
      });

      logger.info('🔐 [CartorioPermissionsManager] Permissões formatadas para envio:', { permissoes });

      // Primeiro, deletar permissões existentes
      const { error: deleteError } = await supabase
        .from('cartorio_acesso_conteudo')
        .delete()
        .eq('cartorio_id', cartorio.id);

      if (deleteError) {
        throw new Error(`Erro ao deletar permissões antigas: ${deleteError.message}`);
      }

      // Inserir novas permissões se houver alguma
      if (permissoes.length > 0) {
        const novasPermissoes = permissoes.map(p => ({
          cartorio_id: cartorio.id,
          sistema_id: p.sistema_id,
          produto_id: p.produto_id,
          ativo: true,
          nivel_acesso: 'completo'
        }));

        const { error: insertError } = await supabase
          .from('cartorio_acesso_conteudo')
          .insert(novasPermissoes);

        if (insertError) {
          throw new Error(`Erro ao inserir novas permissões: ${insertError.message}`);
        }

        logger.info('✅ [CartorioPermissionsManager] Permissões salvas com sucesso');
      }
      
      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso!",
      });

      onUpdate();
      onClose();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      logger.error('❌ [CartorioPermissionsManager] Save error:', { error: err });
      toast({
        title: "Erro ao salvar permissões",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSistema = (sistemaId: string) => {
    const sistemaKey = `sistema-${sistemaId}`;
    const sistema = todosOsSistemas.find(s => s.id === sistemaId);
    const produtoKeys = sistema?.produtos?.map((p: any) => `produto-${p.id}`) || [];
    
    const newSelected = new Set(permissoesSelecionadas);
    
    if (newSelected.has(sistemaKey)) {
      // Desmarcar sistema
      newSelected.delete(sistemaKey);
    } else {
      // Marcar sistema e desmarcar produtos individuais
      newSelected.add(sistemaKey);
      produtoKeys.forEach(key => newSelected.delete(key));
    }
    
    setPermissoesSelecionadas(newSelected);
  };

  const toggleProduto = (produtoId: string, sistemaId: string) => {
    const produtoKey = `produto-${produtoId}`;
    const sistemaKey = `sistema-${sistemaId}`;
    
    const newSelected = new Set(permissoesSelecionadas);
    
    if (newSelected.has(produtoKey)) {
      // Desmarcar produto
      newSelected.delete(produtoKey);
    } else {
      // Marcar produto e desmarcar sistema completo
      newSelected.add(produtoKey);
      if (newSelected.has(sistemaKey)) {
        newSelected.delete(sistemaKey);
      }
    }
    
    setPermissoesSelecionadas(newSelected);
  };

  const toggleExpandirSistema = (sistemaId: string) => {
    const novoExpandidos = new Set(sistemasExpandidos);
    if (novoExpandidos.has(sistemaId)) {
      novoExpandidos.delete(sistemaId);
    } else {
      novoExpandidos.add(sistemaId);
    }
    setSistemasExpandidos(novoExpandidos);
  };

  const contarAulasProduto = (produto: any) => {
    return produto?.video_aulas?.length || 0;
  };

  const contarAulasSistema = (sistema: any) => {
    return sistema?.produtos?.reduce((total: number, produto: any) => {
      return total + (produto?.video_aulas?.length || 0);
    }, 0) || 0;
  };

  useEffect(() => {
    if (isOpen && cartorio) {
      fetchData();
    }
  }, [isOpen, cartorio]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card/95 backdrop-blur-md border-border/50 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <Shield className="h-5 w-5" />
            </span>
            <span className="truncate">Gerenciar Permissões - {cartorio?.nome}</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-destructive mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando permissões...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <PermissionsTree
              todosOsSistemas={todosOsSistemas}
              permissoesSelecionadas={permissoesSelecionadas}
              sistemasExpandidos={sistemasExpandidos}
              toggleSistema={toggleSistema}
              toggleProduto={toggleProduto}
              toggleExpandirSistema={toggleExpandirSistema}
            />

            <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                variant="glow"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Permissões
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
