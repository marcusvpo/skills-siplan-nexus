import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
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

const TIPOS: Record<string, string> = {
  pdf: 'Documento PDF',
  doc: 'Documento Word',
  docx: 'Documento Word',
  xls: 'Planilha Excel',
  xlsx: 'Planilha Excel',
  ppt: 'Apresentação PowerPoint',
  pptx: 'Apresentação PowerPoint',
  txt: 'Arquivo de texto',
  zip: 'Arquivo compactado (ZIP)',
  png: 'Imagem PNG',
  jpg: 'Imagem JPEG',
  jpeg: 'Imagem JPEG',
  webp: 'Imagem WebP',
};

const tituloFromFile = (file: File) =>
  file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || file.name;

const descricaoFromFile = (file: File, produtoNome?: string) => {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const tipo = TIPOS[ext] || `Arquivo ${ext.toUpperCase() || 'genérico'}`;
  const partes = [tipo, formatFileSize(file.size)];
  if (produtoNome) partes.push(`Material de apoio do produto ${produtoNome}`);
  return partes.join(' • ');
};

type Status = 'pendente' | 'enviando' | 'ok' | 'erro';

const ManualUploadDialog: React.FC<ManualUploadDialogProps> = ({ produtoId, produtoNome, open, onOpenChange }) => {
  const { upload } = useManualMutations(produtoId);
  const { toast } = useToast();
  const [files, setFiles] = React.useState<File[]>([]);
  const [status, setStatus] = React.useState<Record<string, Status>>({});
  const [sending, setSending] = React.useState(false);

  const reset = () => {
    setFiles([]);
    setStatus({});
    setSending(false);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const validos = selected.filter((f) => f.size <= MAX_SIZE);
    const grandes = selected.length - validos.length;
    if (grandes > 0) {
      toast({
        title: grandes === 1 ? 'Um arquivo foi ignorado' : `${grandes} arquivos foram ignorados`,
        description: 'O limite por arquivo é de 50MB.',
        variant: 'destructive',
      });
    }
    setFiles((prev) => {
      const chaves = new Set(prev.map((f) => `${f.name}-${f.size}`));
      return [...prev, ...validos.filter((f) => !chaves.has(`${f.name}-${f.size}`))];
    });
    e.target.value = '';
  };

  const removeFile = (key: string) => {
    setFiles((prev) => prev.filter((f) => `${f.name}-${f.size}` !== key));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast({ title: 'Selecione ao menos um arquivo', variant: 'destructive' });
      return;
    }
    setSending(true);
    let ok = 0;
    let erro = 0;
    for (const file of files) {
      const key = `${file.name}-${file.size}`;
      setStatus((s) => ({ ...s, [key]: 'enviando' }));
      try {
        await upload.mutateAsync({
          titulo: tituloFromFile(file),
          descricao: descricaoFromFile(file, produtoNome),
          file,
        });
        ok++;
        setStatus((s) => ({ ...s, [key]: 'ok' }));
      } catch (error) {
        erro++;
        console.error('[ManualUploadDialog] falha no upload', file.name, error);
        setStatus((s) => ({ ...s, [key]: 'erro' }));
      }
    }
    setSending(false);

    if (ok > 0) {
      toast({ title: `${ok} manual(is) enviado(s) com sucesso` });
    }
    if (erro > 0) {
      toast({
        title: `${erro} arquivo(s) não foram enviados`,
        description: 'Verifique os itens marcados em vermelho e tente novamente.',
        variant: 'destructive',
      });
    } else {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (sending) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Novos Manuais
          </DialogTitle>
          <DialogDescription>
            Selecione um ou vários arquivos para o produto {produtoNome ? `"${produtoNome}"` : ''}. O título e a
            descrição são gerados automaticamente a partir de cada documento. Limite de 50MB por arquivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Arquivos *</Label>
            <Input type="file" accept={ACCEPT} multiple onChange={handleFiles} className="bg-background/50" />
          </div>

          {files.length > 0 && (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {files.map((file) => {
                const key = `${file.name}-${file.size}`;
                const st = status[key] || 'pendente';
                return (
                  <div
                    key={key}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                      st === 'erro' ? 'border-destructive/60' : 'border-border/60'
                    }`}
                  >
                    <div className="mt-0.5">
                      {st === 'enviando' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      {st === 'ok' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      {st === 'erro' && <AlertCircle className="h-4 w-4 text-destructive" />}
                      {st === 'pendente' && <FileText className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{tituloFromFile(file)}</p>
                      <p className="truncate text-xs text-muted-foreground">{descricaoFromFile(file, produtoNome)}</p>
                    </div>
                    {!sending && st !== 'ok' && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(key)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button variant="glow" onClick={handleSubmit} disabled={sending || files.length === 0}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {files.length > 1 ? `Enviar ${files.length} manuais` : 'Enviar Manual'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualUploadDialog;
