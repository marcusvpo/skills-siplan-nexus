import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Edit, FolderOpen, Layers, Package, Video } from 'lucide-react';

export interface ContentHit {
  tipo: 'sistema' | 'produto' | 'videoaula';
  id: string;
  titulo: string;
  descricao?: string | null;
  sistema?: { id: string; nome: string } | null;
  produto?: { id: string; nome: string } | null;
  ordem?: number | null;
  idBunny?: string | null;
}

interface Props {
  term: string;
  hits: ContentHit[];
  onOpen: (hit: ContentHit) => void;
  onEdit: (hit: ContentHit) => void;
}

const Highlight: React.FC<{ text: string; term: string }> = ({ text, term }) => {
  const t = term.trim();
  if (!t) return <>{text}</>;
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const haystack = norm(text);
  const needle = norm(t);
  const idx = haystack.indexOf(needle);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary/25 px-0.5 text-foreground">{text.slice(idx, idx + t.length)}</mark>
      {text.slice(idx + t.length)}
    </>
  );
};

const typeMeta = {
  sistema: { label: 'Categoria', Icon: Layers },
  produto: { label: 'Produto', Icon: Package },
  videoaula: { label: 'Videoaula', Icon: Video },
} as const;

export const ContentSearchResults: React.FC<Props> = ({ term, hits, onOpen, onEdit }) => {
  const groups = ([
    { key: 'videoaula' as const, items: hits.filter(h => h.tipo === 'videoaula') },
    { key: 'produto' as const, items: hits.filter(h => h.tipo === 'produto') },
    { key: 'sistema' as const, items: hits.filter(h => h.tipo === 'sistema') },
  ]).filter(g => g.items.length > 0);

  if (hits.length === 0) {
    return (
      <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-md">
        <CardContent className="p-10 text-center">
          <Video className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium text-foreground">Nenhum conteúdo encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tente outro termo — a busca cobre categorias, produtos, títulos e descrições de videoaulas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(group => {
        const { label, Icon } = typeMeta[group.key];
        return (
          <div key={group.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {label}s
              </h3>
              <Badge variant="secondary" className="shrink-0">{group.items.length}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {group.items.map(hit => (
                <Card
                  key={`${hit.tipo}-${hit.id}`}
                  className="group rounded-2xl border-border/50 bg-card/70 backdrop-blur-md transition-colors hover:border-primary/40"
                >
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-secondary/60">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {(hit.sistema || hit.produto) && (
                        <div className="mb-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                          {hit.sistema && <span className="truncate">{hit.sistema.nome}</span>}
                          {hit.sistema && hit.produto && <ChevronRight className="h-3 w-3 shrink-0" />}
                          {hit.produto && <span className="truncate">{hit.produto.nome}</span>}
                        </div>
                      )}
                      <p className="truncate font-semibold text-foreground">
                        <Highlight text={hit.titulo} term={term} />
                      </p>
                      {hit.descricao && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{hit.descricao}</p>
                      )}
                      {hit.idBunny && (
                        <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground/80">
                          Bunny: {hit.idBunny}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      <Button size="sm" variant="outline" onClick={() => onOpen(hit)}>
                        {hit.tipo === 'videoaula' ? (
                          <Video className="h-4 w-4 sm:mr-2" />
                        ) : (
                          <FolderOpen className="h-4 w-4 sm:mr-2" />
                        )}
                        <span className="hidden sm:inline">Abrir</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onEdit(hit)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};