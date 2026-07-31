import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, Loader2, Sparkles, NotebookPen, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import VideoPlayer from '@/components/VideoPlayer';
import AIChat from '@/components/AIChat';
import { VideoProgressButton } from '@/components/VideoProgressButton';
import { useVideoAulaData } from '@/hooks/useSupabaseDataRefactored';
import { logger } from '@/utils/logger';

const VideoLesson: React.FC = () => {
  const { systemId, productId, videoId } = useParams<{
    systemId: string;
    productId: string;
    videoId: string;
  }>();
  const navigate = useNavigate();

  const { data: videoAulaData, isLoading, error } = useVideoAulaData(videoId || '');
  const notesKey = `siplan-notes-${videoId}`;
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (videoId) {
      setNotes(localStorage.getItem(`siplan-notes-${videoId}`) || '');
      logger.info('🎥 [VideoLesson] Page loaded for video', { videoId, systemId, productId });
    }
  }, [videoId, systemId, productId]);

  useEffect(() => {
    const token = localStorage.getItem('siplan-auth-token');
    if (!token) {
      logger.error('❌ [VideoLesson] Token de autenticação não encontrado - redirecionando para login');
      navigate('/login');
    }
  }, [navigate]);

  const backHref = productId ? `/system/${systemId}/product/${productId}` : '/dashboard';

  if (!videoId) {
    logger.error('❌ [VideoLesson] Missing video ID');
    return (
      <div className="page-transition flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-14 w-14 text-destructive" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              ID da videoaula não encontrado
            </h3>
            <Button onClick={() => navigate('/dashboard')} variant="glow" className="mt-4">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-transition flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-foreground">Carregando videoaula...</p>
        </div>
      </div>
    );
  }

  if (error || !videoAulaData) {
    logger.error('❌ [VideoLesson] Error or no data:', { error: (error as Error)?.message });
    return (
      <div className="page-transition flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-14 w-14 text-destructive" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">Erro ao carregar videoaula</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : 'Videoaula não encontrada ou sem permissão de acesso'}
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => navigate(backHref)} variant="glow">
                Voltar
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { produtos: produto } = videoAulaData;
  const sistema = produto?.sistemas;
  const iaDisponivel =
    videoAulaData.titulo?.includes('Orion PRO') || videoAulaData.titulo?.includes('Orion TN');

  return (
    <div className="page-transition min-h-screen text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(backHref)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="min-w-0">
            <p className="truncate text-xs uppercase tracking-wider text-muted-foreground">
              {sistema?.nome} • {produto?.nome}
            </p>
            <p className="truncate text-sm font-medium text-foreground">{videoAulaData.titulo}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Player + conteúdo */}
          <div className="space-y-8 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <VideoPlayer
                videoUrl={videoAulaData.url_video}
                title={videoAulaData.titulo}
                thumbnailUrl={videoAulaData.url_thumbnail}
              />
            </motion.div>

            <div className="space-y-5">
              <h1 className="text-3xl font-bold leading-tight text-foreground">
                {videoAulaData.titulo}
              </h1>

              <div className="max-w-md">
                <VideoProgressButton
                  videoAulaId={videoAulaData.id}
                  videoTitle={videoAulaData.titulo}
                  produtoId={productId}
                  onProgressChange={(id, completo) =>
                    logger.info('🎥 [VideoLesson] Progresso atualizado', { id, completo })
                  }
                />
              </div>

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">
                    <Info className="mr-2 h-4 w-4" />
                    Visão geral
                  </TabsTrigger>
                  <TabsTrigger value="notes">
                    <NotebookPen className="mr-2 h-4 w-4" />
                    Minhas anotações
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Sobre esta aula</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="leading-relaxed text-muted-foreground">
                        {videoAulaData.descricao ||
                          'Esta videoaula ainda não possui descrição cadastrada.'}
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notes">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Minhas anotações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        value={notes}
                        onChange={(e) => {
                          setNotes(e.target.value);
                          localStorage.setItem(notesKey, e.target.value);
                        }}
                        placeholder="Registre aqui os pontos importantes desta aula..."
                        className="min-h-[180px] resize-y bg-background/40"
                      />
                      <p className="text-xs text-muted-foreground">
                        Salvas automaticamente neste navegador.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Assistente IA */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="overflow-hidden border-primary/20">
                <CardHeader className="border-b border-border/50 pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <span>
                      Assistente IA
                      <span className="mt-1 block text-sm font-normal text-muted-foreground">
                        Tire suas dúvidas sobre esta aula
                      </span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[600px] overflow-hidden">
                    {iaDisponivel ? (
                      <AIChat lessonTitle={videoAulaData.titulo} systemName={sistema?.nome} />
                    ) : (
                      <div className="flex h-full items-center justify-center p-6">
                        <div className="space-y-4 text-center">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30">
                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                            Atualmente disponível apenas para os sistemas Orion TN e Orion PRO
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoLesson;