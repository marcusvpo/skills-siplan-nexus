# Módulo de Webinars com validade por vídeo

## Objetivo

Trazer as gravações de webinar para dentro do Skills, acessadas por um usuário único compartilhado com todos os clientes, onde **cada vídeo tem seu próprio prazo de visualização** — sem mexer na validade do token de acesso, que continua sem expirar.

## Como vai funcionar

**Catálogo**

- Um sistema chamado "Webinars" com produtos dentro: Orion PRO, Orion TN, Orion REG e quantos outros você quiser criar depois (o cadastro de produto continua igual ao de hoje).
- Cada webinar gravado entra como uma videoaula do produto correspondente.

**Prazo por vídeo (no cadastro da videoaula)**

Um bloco novo "Disponibilidade do webinar", que só aparece para videoaulas de produtos de webinar:

- Data de publicação (padrão: hoje).
- Dias de disponibilidade (padrão sugerido: 60). O fim é calculado a partir da publicação.
- Opção "definir datas exatas", que sobrescreve o cálculo por dias, para casos específicos.
- Chave liga/desliga para liberar de novo um webinar já bloqueado.

Na lista do admin, cada webinar mostra uma etiqueta clara: "Disponível — expira em X dias", "Agendado para dd/mm" ou "Expirado em dd/mm".

**Visão do cliente — uma experiência própria para webinares**

O módulo de Webinars ganha um padrão visual exclusivo, que só entra em cena quando o usuário tem acesso a esse módulo. Nada de reaproveitar os cards de treinamento.

- **Palco de webinares**: layout em duas faixas — um destaque grande para o webinar mais recente (capa ampla, título, data da gravação, duração e o prazo restante em evidência) e, abaixo, uma linha de edições anteriores em formato de lista/carrossel horizontal por produto (Orion PRO, TN, REG e demais), com abas de produto no topo em vez de navegação em vários níveis.
- **Contagem de prazo em destaque**: cada webinar mostra o tempo restante de forma inequívoca — "disponível por mais 12 dias", virando contagem em dias e horas na última semana, com mudança de cor conforme se aproxima do fim, e a data exata de encerramento sempre visível ao lado.
- **Tela do vídeo**: player em foco, fundo escuro sem distração, cabeçalho enxuto com produto/data, faixa de aviso de prazo fixa acima ou abaixo do player, descrição e tópicos do webinar em coluna lateral discreta. **Sem o chatbot nessas telas.**
- **Estados claros**: webinar encerrado aparece com capa esmaecida e selo "Período de visualização encerrado"; webinar futuro aparece como "em breve" com a data de liberação. Em nenhum dos dois o player é montado.
- Nada de limite de sessões: o mesmo usuário pode assistir em vários lugares ao mesmo tempo, sem restrição.

**Segurança e bloqueio automático**

- O bloqueio é decidido no servidor, não no navegador: o endereço do vídeo só é entregue ao player depois que o servidor confirma que o webinar está dentro do prazo e que aquele cliente tem permissão no produto. Um cliente que inspecione a tela de um webinar encerrado não encontra endereço de vídeo algum, porque ele nunca é enviado.
- O prazo é conferido a cada abertura, comparando com a hora do servidor. O webinar bloqueia sozinho no instante em que vence — **não depende de você excluir nada**. A exclusão do arquivo no Bunny continua sendo um passo manual seu, feito apenas para liberar armazenamento, e é totalmente independente do bloqueio.

Complementos que recomendo, para decidir depois:

1. **Marca d'água discreta na tela** com o usuário/cartório e a data — inibe gravação de tela e repasse, é o item de maior efeito prático.
2. **Registro de visualizações** por webinar: quem abriu e quando. Serve para medir audiência e detectar repasse fora do padrão.
3. Quando quiser subir o nível: rotação periódica do token desse usuário (ex.: um token por trimestre de webinars), sem precisar mudar nada no sistema.

Sobre o link do Bunny: você confirmou que o bloqueio já é acionado lá e que o link direto deixa de ser distribuído. Com isso, os itens acima cobrem o risco restante.

## Etapas de entrega

1. Banco de dados: campos de disponibilidade nas videoaulas e marcação de produto do tipo webinar; o sistema "Webinars" criado com os três produtos iniciais.
2. Servidor: validação de prazo na entrega do vídeo e no carregamento das listas.
3. Admin: bloco de disponibilidade no cadastro/edição de videoaula e etiquetas de situação nos cards.
4. Cliente: novo padrão visual do módulo (palco de webinares, abas por produto, contagem de prazo) e tela de player dedicada sem chatbot.
5. Verificação: cadastrar um webinar já vencido e um válido, e confirmar que o vencido bloqueia sozinho e não carrega o vídeo.

## Detalhes técnicos

- `produtos`: nova coluna `tipo` (`'treinamento' | 'webinar'`, default `'treinamento'`) para condicionar UI e roteamento.
- `video_aulas`: `disponivel_em timestamptz`, `dias_disponibilidade int`, `disponivel_ate timestamptz` (preenchido no save quando houver data exata; caso contrário derivado de `disponivel_em + dias`), `webinar_ativo boolean default true`. Coluna gerada não serve porque `now()` não é imutável; o cálculo fica no save e a checagem final é sempre server-side.
- Nova edge function `get-webinar-video` (`verify_jwt = false`, verificação manual com `jose`, igual às demais): recebe `video_aula_id`, valida o JWT do cartório, confere permissão do produto via `cartorio_acesso_conteudo` e a janela de disponibilidade contra `now()` do servidor, e só então retorna `url_video`. Erros distintos: `WEBINAR_EXPIRED`, `WEBINAR_NOT_STARTED`, `NO_PERMISSION`.
- `get-sistemas-cartorio-with-permissions` passa a devolver, para videoaulas de produto webinar, apenas metadados de janela (`disponivel_em`, `disponivel_ate`, `status`) e **omite `url_video`** — hoje ela retorna `video_aulas (*)`.
- Frontend do módulo: nova rota/página `WebinarHub` (palco + abas por produto) e `WebinarPlayerPage`, com componentes próprios (`WebinarSpotlight`, `WebinarRow`, `WebinarCountdown`), sem reaproveitar `VideoAulasList`/`ProductPage`. O `AIChat` não é montado nessas telas. Sistemas de `tipo = 'webinar'` redirecionam para essas rotas em vez de `/system/:id`.
- `VideoAulaFormFixed` e `ContentManagerFixed`: bloco de disponibilidade condicionado a `produto.tipo === 'webinar'` e badges "expira em X dias" / "encerrado em dd/mm".
- Migração de dados: inserir sistema "Webinars" e os produtos Orion PRO / Orion TN / Orion REG com `tipo = 'webinar'`.
- Marca d'água e log de visualizações ficam para um segundo ciclo, fora deste escopo salvo pedido em contrário.
