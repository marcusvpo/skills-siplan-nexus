
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateVideoAula, useUpdateVideoAula } from '@/hooks/useSupabaseDataRefactored';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { Save, X, Loader2, Radio } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { getWebinarWindow, formatWebinarDate, formatRemaining } from '@/lib/webinar';
import { BunnyVideoFetcher } from '@/components/admin/BunnyVideoFetcher';

/** ISO -> valor aceito por input[type=datetime-local] (hora local) */
const toLocalInput = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  sistema_id: string;
  ordem: number;
  tipo?: string | null;
}

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny?: string;
  url_thumbnail?: string;
  ordem: number;
  produto_id: string;
  disponivel_em?: string | null;
  dias_disponibilidade?: number | null;
  disponivel_ate?: string | null;
  webinar_ativo?: boolean | null;
}

interface VideoAulaFormFixedProps {
  sistema: Sistema;
  produto: Produto;
  videoAula?: VideoAula | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const VideoAulaFormFixed: React.FC<VideoAulaFormFixedProps> = ({
  sistema,
  produto,
  videoAula,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    url_video: '',
    id_video_bunny: '',
    url_thumbnail: '',
    ordem: 1
  });

  const isWebinar = produto.tipo === 'webinar';

  // Disponibilidade (apenas webinars)
  const [webinar, setWebinar] = useState({
    modo: 'dias' as 'dias' | 'datas',
    disponivel_em: toLocalInput(new Date().toISOString()),
    dias_disponibilidade: 60,
    disponivel_ate: '',
    webinar_ativo: true,
  });

  const createVideoAula = useCreateVideoAula();
  const updateVideoAula = useUpdateVideoAula();

  const isLoading = createVideoAula.isPending || updateVideoAula.isPending;

  // Inicializar dados do formulário
  useEffect(() => {
    if (videoAula) {
      setFormData({
        titulo: videoAula.titulo || '',
        descricao: videoAula.descricao || '',
        url_video: videoAula.url_video || '',
        id_video_bunny: videoAula.id_video_bunny || '',
        url_thumbnail: videoAula.url_thumbnail || '',
        ordem: videoAula.ordem || 1
      });
      setWebinar({
        modo: videoAula.disponivel_ate ? 'datas' : 'dias',
        disponivel_em: toLocalInput(videoAula.disponivel_em) || toLocalInput(new Date().toISOString()),
        dias_disponibilidade: videoAula.dias_disponibilidade ?? 60,
        disponivel_ate: toLocalInput(videoAula.disponivel_ate),
        webinar_ativo: videoAula.webinar_ativo !== false,
      });
    } else {
      // Para nova videoaula, usar valores padrão
      setFormData({
        titulo: '',
        descricao: '',
        url_video: '',
        id_video_bunny: '',
        url_thumbnail: '',
        ordem: 1
      });
    }
  }, [videoAula]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    logger.info('📹 [VideoAulaFormFixed] Form submission started:', {
      titulo: formData.titulo,
      produto_id: produto.id,
      isEditing: !!videoAula
    });

    // Validações básicas
    if (!formData.titulo.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Digite um título para a videoaula",
        variant: "destructive",
      });
      return;
    }

    try {
      const videoAulaData = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || undefined,
        url_video: formData.url_video.trim() || '',
        id_video_bunny: formData.id_video_bunny.trim() || undefined,
        url_thumbnail: formData.url_thumbnail.trim() || undefined,
        ordem: formData.ordem,
        produto_id: produto.id,
        ...(isWebinar
          ? {
              disponivel_em: webinar.disponivel_em
                ? new Date(webinar.disponivel_em).toISOString()
                : null,
              dias_disponibilidade:
                webinar.modo === 'dias' ? Number(webinar.dias_disponibilidade) || null : null,
              disponivel_ate:
                webinar.modo === 'datas' && webinar.disponivel_ate
                  ? new Date(webinar.disponivel_ate).toISOString()
                  : null,
              webinar_ativo: webinar.webinar_ativo,
            }
          : {}),
      };

      logger.info('📹 [VideoAulaFormFixed] Submitting data:', videoAulaData);

      if (videoAula) {
        // Editando videoaula existente
        await updateVideoAula.mutateAsync({
          id: videoAula.id,
          ...videoAulaData
        });
      } else {
        // Criando nova videoaula
        await createVideoAula.mutateAsync(videoAulaData);
      }

      logger.info('✅ [VideoAulaFormFixed] Form submitted successfully');
      
      // Aguardar um pouco e chamar onSuccess
      setTimeout(() => {
        onSuccess();
      }, 1000);
      
    } catch (error) {
      logger.error('❌ [VideoAulaFormFixed] Form submission failed:', { error });
      // O erro já é tratado nos hooks, não precisamos fazer nada aqui
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBunnyVideoSelect = (details: {
    videoId: string;
    title: string;
    playUrl: string;
    thumbnailUrl: string | null;
  }) => {
    logger.info('📹 [VideoAulaFormFixed] Bunny video selected', { videoId: details.videoId });
    setFormData(prev => ({
      ...prev,
      id_video_bunny: details.videoId,
      url_video: details.playUrl || prev.url_video,
      url_thumbnail: details.thumbnailUrl || prev.url_thumbnail,
      titulo: prev.titulo.trim() ? prev.titulo : details.title
    }));
    toast({
      title: "Vídeo encontrado",
      description: details.title,
    });
  };

  return (
    <Card
      className={
        isWebinar
          ? 'relative overflow-hidden rounded-[1.75rem] border-webinar/30 bg-webinar-surface/80 backdrop-blur-md'
          : 'bg-card/70 backdrop-blur-md border-border/50 rounded-2xl'
      }
    >
      {isWebinar && (
        <>
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'var(--gradient-webinar)' }} />
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-webinar/20 blur-3xl" />
        </>
      )}
      <CardHeader className={isWebinar ? 'relative pt-7' : undefined}>
        {isWebinar && (
          <span className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-webinar/40 bg-webinar/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-webinar">
            <Radio className="h-3 w-3" />
            Módulo Webinar
          </span>
        )}
        <CardTitle
          className={
            isWebinar
              ? 'text-2xl font-bold uppercase tracking-tight text-webinar-foreground'
              : 'text-foreground'
          }
        >
          {isWebinar
            ? videoAula
              ? 'Editar Webinar'
              : 'Nova Gravação de Webinar'
            : videoAula
              ? 'Editar Videoaula'
              : 'Nova Videoaula'}
        </CardTitle>
        <div className={isWebinar ? 'text-sm text-webinar-foreground/70' : 'text-sm text-muted-foreground'}>
          <p><strong>{isWebinar ? 'Categoria:' : 'Sistema:'}</strong> {sistema.nome}</p>
          <p><strong>Produto:</strong> {produto.nome}</p>
        </div>
      </CardHeader>
      <CardContent className={isWebinar ? 'relative' : undefined}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {isWebinar && (
            <div className="space-y-2">
              <Label className="font-mono text-[11px] uppercase tracking-[0.18em] text-webinar">
                1 · Vídeo no Bunny.net
              </Label>
              <BunnyVideoFetcher
                onVideoSelect={handleBunnyVideoSelect}
                initialVideoId={formData.id_video_bunny}
                disabled={isLoading}
              />
              <p className="text-xs text-webinar-foreground/60">
                Ao informar o ID, o título, o link e a capa são preenchidos automaticamente.
              </p>
            </div>
          )}

          <div>
            <Label
              htmlFor="titulo"
              className={
                isWebinar
                  ? 'font-mono text-[11px] uppercase tracking-[0.18em] text-webinar'
                  : 'text-muted-foreground'
              }
            >
              {isWebinar ? '2 · Título do webinar *' : 'Título da Videoaula *'}
            </Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              className="bg-background/50 border-border text-foreground"
              placeholder={isWebinar ? 'Ex.: Novidades Orion PRO — Setembro' : 'Digite o título da videoaula'}
              disabled={isLoading}
              required
            />
          </div>

          {!isWebinar && (
            <div>
              <Label htmlFor="descricao" className="text-muted-foreground">
                Descrição
              </Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                className="bg-background/50 border-border text-foreground"
                placeholder="Descrição da videoaula (opcional)"
                rows={3}
                disabled={isLoading}
              />
            </div>
          )}

          {!isWebinar && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Buscar vídeo no Bunny.net
              </Label>
              <BunnyVideoFetcher
                onVideoSelect={handleBunnyVideoSelect}
                initialVideoId={formData.id_video_bunny}
                disabled={isLoading}
              />
            </div>
          )}

          {!isWebinar && (
            <div>
              <Label htmlFor="url_video" className="text-muted-foreground">
                URL do Vídeo
              </Label>
              <Input
                id="url_video"
                value={formData.url_video}
                onChange={(e) => handleInputChange('url_video', e.target.value)}
                className="bg-background/50 border-border text-foreground"
                placeholder="https://..."
                disabled={isLoading}
              />
            </div>
          )}

          {!isWebinar && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ordem" className="text-muted-foreground">
                  Ordem
                </Label>
                <Input
                  id="ordem"
                  type="number"
                  value={formData.ordem}
                  onChange={(e) => handleInputChange('ordem', parseInt(e.target.value) || 1)}
                  className="bg-background/50 border-border text-foreground"
                  min="1"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}


          {isWebinar && (
            <div className="space-y-4 rounded-2xl border border-webinar/30 bg-webinar/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-webinar">
                  <Radio className="h-4 w-4" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                    3 · Prazo de visualização
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Liberado</Label>
                  <Switch
                    checked={webinar.webinar_ativo}
                    onCheckedChange={(v) => setWebinar((p) => ({ ...p, webinar_ativo: v }))}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Publicado em</Label>
                  <Input
                    type="datetime-local"
                    value={webinar.disponivel_em}
                    onChange={(e) => setWebinar((p) => ({ ...p, disponivel_em: e.target.value }))}
                    className="bg-background/50 border-border text-foreground"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Forma de definir o prazo</Label>
                  <div className="mt-2 flex gap-2">
                    {(['dias', 'datas'] as const).map((modo) => (
                      <Button
                        key={modo}
                        type="button"
                        size="sm"
                        variant={webinar.modo === modo ? 'glow' : 'outline'}
                        onClick={() => setWebinar((p) => ({ ...p, modo }))}
                        disabled={isLoading}
                      >
                        {modo === 'dias' ? 'Por dias' : 'Data exata'}
                      </Button>
                    ))}
                  </div>
                </div>

                {webinar.modo === 'dias' ? (
                  <div>
                    <Label className="text-muted-foreground">Dias de disponibilidade</Label>
                    <Input
                      type="number"
                      min={1}
                      value={webinar.dias_disponibilidade}
                      onChange={(e) =>
                        setWebinar((p) => ({ ...p, dias_disponibilidade: parseInt(e.target.value) || 0 }))
                      }
                      className="bg-background/50 border-border text-foreground"
                      disabled={isLoading}
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="text-muted-foreground">Disponível até</Label>
                    <Input
                      type="datetime-local"
                      value={webinar.disponivel_ate}
                      onChange={(e) => setWebinar((p) => ({ ...p, disponivel_ate: e.target.value }))}
                      className="bg-background/50 border-border text-foreground"
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>

              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {(() => {
                  const w = getWebinarWindow({
                    disponivel_em: webinar.disponivel_em
                      ? new Date(webinar.disponivel_em).toISOString()
                      : null,
                    dias_disponibilidade:
                      webinar.modo === 'dias' ? Number(webinar.dias_disponibilidade) : null,
                    disponivel_ate:
                      webinar.modo === 'datas' && webinar.disponivel_ate
                        ? new Date(webinar.disponivel_ate).toISOString()
                        : null,
                    webinar_ativo: webinar.webinar_ativo,
                  });
                  if (!webinar.webinar_ativo) return 'Bloqueado manualmente';
                  if (!w.endsAt) return 'Sem prazo de expiração definido';
                  return `Expira em ${formatWebinarDate(w.endsAt)} · ${formatRemaining(w.msRemaining)} restantes`;
                })()}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="url_thumbnail" className="text-muted-foreground">
              URL Thumbnail
            </Label>
            <Input
              id="url_thumbnail"
              value={formData.url_thumbnail}
              onChange={(e) => handleInputChange('url_thumbnail', e.target.value)}
              className="bg-background/50 border-border text-foreground"
              placeholder="https://..."
              disabled={isLoading}
            />
          </div>

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.titulo.trim()}
              variant="glow"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {videoAula ? 'Atualizar' : 'Salvar'} Videoaula
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="border-border text-muted-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
