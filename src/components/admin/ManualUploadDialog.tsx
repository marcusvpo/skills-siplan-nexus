import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, FileText } from 'lucide-react';
import { useManualMutations, formatFileSize } from '@/hooks/useProdutoManuais';
import { useToast } from '@/hooks/use-toast';

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg,.webp';
const MAX_SIZE = 50 * 1024 * 1024;

interface ManualUploadDialogProps {
  produtoId: string;
  produtoNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManualUploadDialog: React.FC<ManualUploadDialogProps> = ({ produtoId, produtoNome, open, onOpenChange }) => {
  const { upload } = useManualMutations(produtoId);
  const { toast } = useToast();
  const [titulo, setTitulo] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);

  const reset = () => {
    setTitulo('');
    setDescricao('');
    setFile(null);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.size > MAX_SIZE) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O limite por arquivo é de 50MB.',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }
    setFile(selected);
    if (selected && !titulo.trim()) {
      setTitulo(selected.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !file) {
      toast({ title: 'Preencha o título e selecione um arquivo', variant: 'destructive' });
      return;
    }
    try {
      await upload.mutateAsync({ titulo: titulo.trim(), descricao: descricao.trim() || undefined, file });
      toast({ title: 'Manual enviado com sucesso' });
      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro ao enviar manual',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Novo Manual
          </DialogTitle>
          <DialogDescription>
            Anexe um documento ao produto {produtoNome ? `"${produtoNome}"` : ''}. Limite de 50MB por arquivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Manual de Instalação"
              className="bg-background/50"
            />
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="bg-background/50"
            />
          </div>
          <div>
            <Label>Arquivo *</Label>
            <Input type="file" accept={ACCEPT} onChange={handleFile} className="bg-background/50" />
            {file && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {file.name} — {formatFileSize(file.size)}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={upload.isPending}>
              Cancelar
            </Button>
            <Button variant="glow" onClick={handleSubmit} disabled={upload.isPending}>
              {upload.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Enviar Manual
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualUploadDialog;
