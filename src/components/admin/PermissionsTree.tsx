import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ChevronDown, ChevronRight, BookOpen, Radio } from 'lucide-react';

interface PermissionsTreeProps {
  todosOsSistemas: any[];
  permissoesSelecionadas: Set<string>;
  sistemasExpandidos: Set<string>;
  toggleSistema: (sistemaId: string) => void;
  toggleProduto: (produtoId: string, sistemaId: string) => void;
  toggleExpandirSistema: (sistemaId: string) => void;
}

const contarAulasProduto = (produto: any) => produto?.video_aulas?.length || 0;
const contarAulasSistema = (sistema: any) =>
  sistema?.produtos?.reduce((t: number, p: any) => t + (p?.video_aulas?.length || 0), 0) || 0;

/** Layout compartilhado de permissões (modal "Gerenciar Permissões" e wizard de criação). */
export const PermissionsTree: React.FC<PermissionsTreeProps> = ({
  todosOsSistemas,
  permissoesSelecionadas,
  sistemasExpandidos,
  toggleSistema,
  toggleProduto,
  toggleExpandirSistema,
}) => (
  <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-destructive">Como funciona:</h4>
                  <ul className="text-sm text-destructive/90 mt-1 space-y-1">
                    <li>• Marque um <strong>Sistema</strong> para dar acesso completo a todos os produtos</li>
                    <li>• Clique em um sistema para expandir e marcar <strong>Produtos</strong> específicos</li>
                    <li>• Se nenhuma permissão for marcada, o cartório terá acesso a tudo</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {todosOsSistemas.map((sistema) => {
                const sistemaKey = `sistema-${sistema.id}`;
                const sistemaSelected = permissoesSelecionadas.has(sistemaKey);
                const expandido = sistemasExpandidos.has(sistema.id);
                const aulasSistema = contarAulasSistema(sistema);
                const produtosCount = sistema?.produtos?.length || 0;
                const isWebinarSistema = Array.isArray(sistema?.produtos)
                  && sistema.produtos.some((p: any) => p?.tipo === 'webinar');

                return (
                  <Card
                    key={sistema.id}
                    className={
                      isWebinarSistema
                        ? 'relative overflow-hidden rounded-[1.5rem] border-webinar/30 bg-webinar-surface/80 backdrop-blur-md'
                        : 'bg-card/70 backdrop-blur-md border-border/50 rounded-xl overflow-hidden'
                    }
                  >
                    {isWebinarSistema && (
                      <>
                        <div className="absolute inset-y-0 left-0 w-1" style={{ background: 'var(--gradient-webinar)' }} />
                        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-webinar/10 blur-3xl" />
                      </>
                    )}
                    <CardHeader className={isWebinarSistema ? 'relative pb-3 pl-6' : 'pb-3'}>
                      <div
                        className="flex items-center gap-3 cursor-pointer select-none"
                        onClick={() => toggleExpandirSistema(sistema.id)}
                      >
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={sistemaSelected}
                            onCheckedChange={() => toggleSistema(sistema.id)}
                          />
                        </div>
                        <div className={`flex items-center justify-center h-7 w-7 rounded-lg shrink-0 ${
                          isWebinarSistema ? 'bg-webinar/15 text-webinar' : 'bg-primary/10 text-primary'
                        }`}>
                          {expandido ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className={
                              isWebinarSistema
                                ? 'text-base font-bold uppercase tracking-tight text-webinar-foreground truncate'
                                : 'text-base font-semibold truncate'
                            }>
                              {sistema.nome}
                            </CardTitle>
                            {isWebinarSistema && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-webinar/40 bg-webinar/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-webinar">
                                <Radio className="h-3 w-3" />
                                Webinar
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                              isWebinarSistema
                                ? 'border border-webinar/30 bg-webinar/10 font-mono text-webinar'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <BookOpen className="h-3 w-3" />
                              {aulasSistema} {isWebinarSistema
                                ? (aulasSistema === 1 ? 'gravação' : 'gravações')
                                : (aulasSistema === 1 ? 'aula' : 'aulas')}
                            </span>
                            <span className={isWebinarSistema ? 'text-xs text-webinar-foreground/60' : 'text-xs text-muted-foreground'}>
                              ({produtosCount} {produtosCount === 1 ? 'produto' : 'produtos'})
                            </span>
                          </div>
                        </div>
                        {sistemaSelected && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap shrink-0 ${
                            isWebinarSistema ? 'bg-webinar/15 text-webinar' : 'bg-success/15 text-success'
                          }`}>
                            Acesso Completo
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    
                    {expandido && sistema.produtos && sistema.produtos.length > 0 && (
                      <CardContent className={
                        isWebinarSistema
                          ? 'relative pt-0 pl-6 border-t border-webinar/20'
                          : 'pt-0 border-t border-border/30'
                      }>
                        <div className="py-3 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {sistema.produtos.map((produto: any) => {
                              const produtoKey = `produto-${produto.id}`;
                              const produtoSelected = permissoesSelecionadas.has(produtoKey);
                              const aulasProduto = contarAulasProduto(produto);
                              const isWebinarProd = produto?.tipo === 'webinar';
                              
                              return (
                                <div
                                  key={produto.id}
                                  className={
                                    isWebinarProd
                                      ? 'flex items-start space-x-2 p-2 rounded-xl border border-webinar/25 bg-webinar/5 hover:bg-webinar/10 transition-colors'
                                      : 'flex items-start space-x-2 p-2 rounded-lg bg-background/40 hover:bg-background/60 transition-colors'
                                  }
                                >
                                  <Checkbox
                                    checked={produtoSelected || sistemaSelected}
                                    disabled={sistemaSelected}
                                    onCheckedChange={() => toggleProduto(produto.id, sistema.id)}
                                    className="mt-0.5"
                                  />
                                  <label className={`text-sm cursor-pointer flex-1 leading-tight ${
                                    isWebinarProd
                                      ? 'text-webinar-foreground/70'
                                      : sistemaSelected ? 'text-success' : 'text-muted-foreground'
                                  }`}>
                                    <span className={
                                      isWebinarProd
                                        ? 'font-semibold uppercase tracking-tight text-webinar-foreground'
                                        : 'font-medium text-foreground'
                                    }>
                                      {produto.nome}
                                    </span>
                                    <span className={
                                      isWebinarProd
                                        ? 'block font-mono text-[11px] mt-0.5 text-webinar'
                                        : 'block text-xs mt-0.5'
                                    }>
                                      {aulasProduto} {isWebinarProd
                                        ? (aulasProduto === 1 ? 'gravação' : 'gravações')
                                        : (aulasProduto === 1 ? 'aula' : 'aulas')}
                                    </span>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
  </div>
);
