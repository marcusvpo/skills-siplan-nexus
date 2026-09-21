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

**Visão do cliente**

- O usuário genérico de webinar entra normalmente e vê o sistema "Webinars" com os produtos que você liberou nas permissões (o controle por cliente que já existe continua valendo).
- Cada card de webinar mostra o prazo restante ("disponível até dd/mm" ou "últimos 3 dias").
- Webinar expirado aparece bloqueado, com aviso "Período de visualização encerrado — fale com seu consultor". O player não carrega.
- Webinar ainda não publicado aparece como "em breve".

**Segurança**

O bloqueio é decidido no servidor, não no navegador: o endereço do vídeo só é entregue ao player depois que o servidor confirma que o webinar está dentro do prazo e que aquele cliente tem permissão no produto. Um cliente que inspecione a tela de um webinar expirado não encontra endereço de vídeo algum, porque ele nunca é enviado.

Complementos que recomendo (em ordem de impacto), para decidir depois:

1. **Marca d'água discreta na tela** com o usuário/cartório e a data — inibe gravação de tela e repasse, é o item de maior efeito prático.
2. **Registro de visualizações** por webinar: quem abriu, quando, de qual IP. Serve para detectar repasse de credencial (mesmo usuário, muitos IPs distintos em pouco tempo) e para você medir audiência.
3. **Limite de sessões simultâneas** no usuário de webinar, se um dia o compartilhamento passar do aceitável.
4. Quando quiser subir o nível: rotação periódica do token desse usuário (ex.: um token por trimestre de webinars), sem precisar mudar nada no sistema.

Sobre o link do Bunny: você confirmou que o bloqueio de domínio/referer já está ativo lá e que o link direto deixa de ser distribuído. Com isso, os itens acima cobrem o risco restante, que passa a ser repasse de credencial — e não mais repasse de link.

## Etapas de entrega

1. Banco de dados: campos de disponibilidade nas videoaulas e marcação de produto do tipo webinar; o sistema "Webinars" criado com os três produtos iniciais.
2. Servidor: validação de prazo na entrega do vídeo e no carregamento das listas.
3. Admin: bloco de disponibilidade no cadastro/edição de videoaula e etiquetas de situação nos cards.
4. Cliente: prazo nos cards, estado bloqueado e estado "em breve".
5. Verificação: cadastrar um webinar já expirado e um válido, e confirmar que o expirado não carrega o vídeo.

## Detalhes técnicos

- `produtos`: nova coluna `tipo` (`'treinamento' | 'webinar'`, default `'treinamento'`) para condicionar a UI de disponibilidade.
- `video_aulas`: `disponivel_em timestamptz`, `dias_disponibilidade int`, `disponivel_ate timestamptz` (preenchido no save quando houver data exata; caso contrário derivado de `disponivel_em + dias`), `webinar_ativo boolean default true`. Uma coluna gerada não serve porque `now()` não é imutável; o cálculo fica no save e a checagem final é sempre server-side.
- Nova edge function `get-webinar-video` (`verify_jwt = false`, verificação manual com `jose`, igual às demais): recebe `video_aula_id`, valida o JWT do cartório, confere permissão do produto via `cartorio_acesso_conteudo` e a janela de disponibilidade, e só então retorna `url_video`. Erros distintos: `WEBINAR_EXPIRED`, `WEBINAR_NOT_STARTED`, `NO_PERMISSION`.
- `get-sistemas-cartorio-with-permissions` passa a devolver, para videoaulas de produto webinar, apenas metadados de janela (`disponivel_em`, `disponivel_ate`, `status`) e **omite `url_video`** — hoje ela retorna `video_aulas (*)`.
- `VideoLesson`/`VideoDirectView`: para produto webinar, buscar a URL via `get-webinar-video` em vez de usar o campo do registro; renderizar estados bloqueado/em breve antes de montar o `VideoPlayer`.
- `VideoAulaFormFixed` e `ContentManagerFixed`: bloco de disponibilidade condicionado a `produto.tipo === 'webinar'` e badges de situação.
- Migração de dados: inserir sistema "Webinars" e os produtos Orion PRO / Orion TN / Orion REG com `tipo = 'webinar'`.
- Marca d'água e log de visualizações ficam como itens 2 e 3 de um segundo ciclo, fora deste escopo salvo pedido em contrário.
