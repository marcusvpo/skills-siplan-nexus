import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ExternalLink, Loader2, FileArchive, FileSpreadsheet, FileImage, File } from 'lucide-react';
import { useProdutoManuais, getManualUrl, formatFileSize, type ProdutoManual } from '@/hooks/useProdutoManuais';
import { useToast } from '@/hooks/use-toast';

export const manualIcon = (mime?: string | null) => {
  const m = (mime || '').toLowerCase();
  if (m.includes('pdf')) return FileText;
  if (m.includes('zip') || m.includes('rar') || m.includes('compressed')) return FileArchive;
  if (m.includes('sheet') || m.includes('excel') || m.includes('csv')) return FileSpreadsheet;
  if (m.startsWith('image/')) return FileImage;
  if (m.includes('word') || m.includes('text')) return FileText;
  return File;
};

interface ManuaisModalProps {
  produtoId: string;
  produtoNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManuaisModal: React.FC<ManuaisModalProps> = ({ produtoId, produtoNome, open, onOpenChange }) => {
  const { data: manuais = [], isLoading } = useProdutoManuais(produtoId);
  const { toast } = useToast();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const handleOpen = async (manual: ProdutoManual, download: boolean) => {
    try {
      setBusyId(manual.id + (download ? '-d' : '-o'));
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
        title: 'Não foi possível abrir o manual',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Manuais {produtoNome ? `— ${produtoNome}` : ''}
          </DialogTitle>
          <DialogDescription>
            Documentos de apoio disponibilizados para este produto.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando manuais...
          </div>
        ) : manuais.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhum manual disponível para este produto.
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {manuais.map((manual) => {
              const Icon = manualIcon(manual.mime_type);
              return (
                <div
                  key={manual.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{manual.titulo}</p>
                      {manual.descricao && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{manual.descricao}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {formatFileSize(manual.file_size)}
                        </Badge>
                        <span className="truncate text-[10px] text-muted-foreground/70">{manual.file_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant="glow" onClick={() => handleOpen(manual, false)} disabled={!!busyId}>
                      {busyId === manual.id + '-o' ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Abrir
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleOpen(manual, true)} disabled={!!busyId}>
                      {busyId === manual.id + '-d' ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Baixar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManuaisModal;
