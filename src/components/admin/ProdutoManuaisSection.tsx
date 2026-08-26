import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Download, ExternalLink, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  useProdutoManuais,
  useManualMutations,
  getManualUrl,
  formatFileSize,
  type ProdutoManual,
} from '@/hooks/useProdutoManuais';
import { manualIcon } from '@/components/manuais/ManuaisModal';
import { useToast } from '@/hooks/use-toast';

interface ProdutoManuaisSectionProps {
  produtoId: string;
}

const ProdutoManuaisSection: React.FC<ProdutoManuaisSectionProps> = ({ produtoId }) => {
  const { data: manuais = [], isLoading } = useProdutoManuais(produtoId);
  const { update, remove } = useManualMutations(produtoId);
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<ProdutoManual | null>(null);
  const [titulo, setTitulo] = React.useState('');
  const [descricao, setDescricao] = React.useState('');

  const openManual = async (manual: ProdutoManual, download: boolean) => {
    try {
      const url = await getManualUrl(manual.storage_path, download);
      if (download) {
        const link = document.createElement('a');
        link.href = url;
        link.download = manual.file_name;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      toast({
        title: 'Erro ao abrir manual',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (manual: ProdutoManual) => {
    setEditing(manual);
    setTitulo(manual.titulo);
    setDescricao(manual.descricao || '');
  };

  const saveEdit = async () => {
    if (!editing || !titulo.trim()) return;
    try {
      await update.mutateAsync({ id: editing.id, titulo: titulo.trim(), descricao: descricao.trim() || undefined });
      toast({ title: 'Manual atualizado' });
      setEditing(null);
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (manual: ProdutoManual) => {
    if (!window.confirm(`Excluir o manual "${manual.titulo}"?`)) return;
    try {
      await remove.mutateAsync(manual.id);
      toast({ title: 'Manual excluído' });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold text-foreground">Manuais do Produto</h3>
        <Badge variant="secondary" className="bg-secondary/70 text-muted-foreground">
          {manuais.length} arquivo{manuais.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando manuais...
        </div>
      ) : manuais.length === 0 ? (
        <Card className="rounded-2xl border-border/50 bg-card/60 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </span>
            <p className="text-sm text-muted-foreground">
              Nenhum manual anexado. Use o botão "Novo Manual" para enviar documentos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {manuais.map((manual, index) => {
            const Icon = manualIcon(manual.mime_type);
            return (
              <motion.div
                key={manual.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.3) }}
              >
                <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-md transition-all hover:border-primary/40">
                  <CardContent className="flex items-start gap-3 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground" title={manual.titulo}>
                        {manual.titulo}
                      </p>
                      {manual.descricao && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{manual.descricao}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{formatFileSize(manual.file_size)}</Badge>
                        <span className="truncate text-[10px] text-muted-foreground/70">{manual.file_name}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openManual(manual, false)}>
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Abrir
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openManual(manual, true)}>
                          <Download className="mr-1.5 h-3.5 w-3.5" /> Baixar
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => startEdit(manual)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-destructive/50 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(manual)}
                          disabled={remove.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="bg-background/50" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className="bg-background/50" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button variant="glow" onClick={saveEdit} disabled={update.isPending}>
                {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProdutoManuaisSection;
