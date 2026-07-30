# Modernização visual da plataforma Siplan Skills

Elevação completa da interface mantendo 100% da paleta institucional (preto/grafite + vermelho) já definida nas variáveis HSL do `index.css` e no `tailwind.config.ts`. Nenhuma cor nova é introduzida: a modernização vem de profundidade, vidro (glassmorphism), bordas sutis, opacidades e animação.

## Etapa 0 — Biblioteca base (src/components/ui)

- **Button**: feedback tátil no clique (escala 0.97), nova variante `glow` com sombra da própria cor primária, estados de hover/active/focus-visible com anel translúcido.
- **Card**: padrão "Modern Glass & Elevation" (`bg-card/80 backdrop-blur-md`, borda `border/50`), com opção de hover elevado (leve subida, borda primária, sombra ampliada).
- **Badge**: fundos translúcidos, bordas ultrafinas e variantes de status com ponto pulsante (Ativo, Em Progresso, Pendente).
- **Progress**: barra fluida com brilho na ponta e transição de largura de 700ms.
- **Table**: cabeçalhos em caixa alta com espaçamento de letras e tom muted; linhas com hover suave e estado selecionado translúcido.
- **Dialog / Sheet / Drawer**: overlay com desfoque de fundo e animações de entrada/saída mais suaves.
- **Tabs**: indicador de "pílula deslizante" que acompanha a aba ativa.

## Etapa 1 — Experiência do aluno

`Dashboard.tsx`, `ProductPage.tsx`, `TreinamentosSection.tsx`:

- Hero de boas-vindas personalizado com o nome do usuário.
- Banner "Continuar de onde parou" com thumbnail, progresso embutido e botão play pulsante.
- Grid de trilhas/cursos com cards gamificados: máscara de luz no hover, badges de status flutuantes, progresso (circular SVG ou linear), elevação 3D e botão "Acessar curso" em fade-in.
- Widget de métricas pessoais (horas estudadas, conclusão geral, certificados) e carrossel de próximos módulos recomendados.

Todos os números vêm dos hooks de progresso já existentes; nada de dados inventados. Onde uma métrica não existir no backend atual (ex.: horas estudadas), ela é derivada do progresso já registrado ou omitida — sem criar tabelas novas.

## Etapa 2 — Experiência do administrador

`AdminDashboard.tsx`, `DashboardStats.tsx`, `CartorioUsersManagement.tsx`, `CartorioAccessManager.tsx`:

- Bento Grid assimétrico de métricas, com um card de alto impacto (tipografia ampliada e gráfico de tendência ao fundo) e cards secundários com ícones em containers arredondados de gradiente sutil.
- Gráficos Recharts com área em gradiente de opacidade e tooltip flutuante em vidro.
- Gestão de cartórios/usuários: busca com filtros em pílulas (status, permissão), linhas com avatar, categorização de e-mail/cartório e indicadores de status com luz pulsante.
- Edição migrada de modal pesado para **Slide-over Drawer** à direita, preservando o contexto da lista.

Regras de negócio, RLS, edge functions e a hierarquia Sistema → Produto → Videoaula permanecem intactas — a mudança é de apresentação.

## Etapa 3 — Aula e player

`VideoLesson.tsx`, `VideoPlayer.tsx`:

- Player em modo cinema: proporção 16:9, cantos arredondados, luz de ambiente sutil ao redor, ações rápidas flutuantes (modo teatro, velocidade, concluir aula).
- Sidebar de módulos em accordion com contador por módulo e estados claros: concluída (check com pulso), atual (borda lateral + fundo em destaque + "tocando agora"), bloqueada (cadeado muted).
- Abas abaixo do player com animação de pílula: Visão geral, Material de apoio, Quiz de fixação, Minhas anotações.
- Celebração de conclusão: micro-animação com confete sutil e modal "Ir para próxima aula".

As anotações usam armazenamento local no navegador nesta entrega, salvo pedido para persistir no Supabase.

## Detalhes técnicos

- Adicionar `framer-motion` (ainda não está no projeto) para as micro-interações; `recharts` já está instalado. Confete via animação leve própria ou `canvas-confetti`.
- Nenhuma variável de cor nova: todo o visual usa os tokens existentes com opacidades (`bg-card/80`, `border-primary/20`, `shadow-primary/20`).
- Componentes de página quebrados em subcomponentes menores (hero, cards de curso, bento cards, drawer de edição) para manter os arquivos limpos.
- Hooks, cliente Supabase, edge functions e rotas do React Router não mudam de assinatura; as telas continuam consumindo os mesmos dados.
- Entrega em três lotes na ordem Etapa 0 → 1 → 2 → 3, com verificação de build e checagem visual das rotas principais a cada lote.
