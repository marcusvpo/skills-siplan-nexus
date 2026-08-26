# Manuais por Produto (PDF e outros arquivos)

Nova funcionalidade para anexar documentos (manuais) a cada produto, gerenciados pelo admin e consultados pelo usuário do cartório na tela de videoaulas do produto.

## Visão do Admin (/admin > Conteúdo)

- Na tela de Videoaulas de um produto, ao lado do botão "Nova Videoaula", novo botão "Novo Manual".
- Ao clicar, abre um modal de upload com: título, descrição opcional, seleção de arquivo (PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, ZIP, imagens) e limite de 50MB.
- Abaixo do grid de videoaulas, nova seção "Manuais do Produto" listando os arquivos anexados com nome, tipo, tamanho, data e ações: abrir, baixar, renomear (título/descrição) e excluir.
- Exclusão remove o registro e o arquivo do Storage.

## Visão do Usuário (/system/:systemId/product/:productId)

- Na linha da barra de pesquisa de videoaulas, novo botão "Ver Manuais" (com contador de manuais disponíveis). O botão não aparece quando o produto não tem manuais.
- O botão também aparece quando o produto exibe Trilhas de Aprendizagem, mantendo o comportamento atual das duas visões.
- Ao clicar, abre um modal listando os manuais com ícone por tipo de arquivo, título, descrição, tamanho e dois botões: "Abrir" (nova guia) e "Baixar".

## Banco de dados e Storage (Supabase)

- Novo bucket de Storage `manuais` (público, limite de 50MB por arquivo), caminho `produto_id/timestamp-nome-do-arquivo`.
- Nova tabela `public.produto_manuais`: `produto_id` (FK para produtos, cascade), `titulo`, `descricao`, `storage_path`, `file_name`, `mime_type`, `file_size`, `ordem`, `created_at`, `updated_at` (com trigger de atualização).
- Acesso à leitura: liberado para `anon` e `authenticated` (os manuais seguem o conteúdo do produto, que já é lido pelo mesmo caminho público de sistemas/produtos).
- Escrita (inserir/editar/excluir) restrita ao `service_role`, ou seja, apenas via edge function administrativa — o frontend do cartório nunca pode gravar.
- Políticas de Storage em `storage.objects` para o bucket `manuais`: leitura pública; upload/atualização/remoção apenas pelo `service_role`.

## Detalhes técnicos

- Nova edge function `manage-produto-manuais` (`verify_jwt = false`, validação manual do token de admin no padrão já usado em `delete-cartorio`/`create-trilha`), com ações `upload`, `update` e `delete`, usando `SUPABASE_SERVICE_ROLE_KEY` para gravar no Storage e na tabela. O arquivo é enviado em base64 ou via `FormData`.
- Novo hook `src/hooks/useProdutoManuais.ts` (react-query): `useProdutoManuais(produtoId)` para leitura e mutations de upload/update/delete que invalidam a query.
- Novo componente `src/components/manuais/ManuaisModal.tsx` (visão usuário) e `src/components/admin/ManualUploadDialog.tsx` + `src/components/admin/ProdutoManuaisSection.tsx` (visão admin).
- Integrações: `src/components/admin/ContentManagerFixed.tsx` (botão + seção), `src/pages/ProductPage.tsx` (botão "Ver Manuais" na barra de filtros/topo) e `src/components/product/VideoAulasList.tsx` (slot para o botão ao lado da busca).
- URLs públicas geradas com `supabase.storage.from('manuais').getPublicUrl(path)`; download forçado via atributo `download` no link.
- Estilo seguindo o design system atual: cards glassmorphism, botão primário `variant="glow"`, animações `framer-motion`.

## Ordem de execução

1. Migração da tabela + criação do bucket + políticas de Storage.
2. Edge function administrativa.
3. Hook e componentes.
4. Integração nas telas de admin e do usuário.
