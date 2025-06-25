
-- Primeiro, inserir o cartório de demonstração se ele não existir
INSERT INTO public.cartorios (id, nome, cnpj) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Cartório de Demonstração',
  '00.000.000/0001-00'
)
ON CONFLICT (id) DO NOTHING;

-- Inserir o usuário administrador na tabela admins
INSERT INTO public.admins (id, email, nome) 
VALUES (
  'cbda3e7c-6547-40c8-aad2-38098bb307a6',
  'admin@siplan.com.br', 
  'Administrador Siplan'
)
ON CONFLICT (email) DO UPDATE SET 
  nome = EXCLUDED.nome,
  id = EXCLUDED.id;

-- Inserir ou atualizar o acesso de demonstração para o cartório
INSERT INTO public.acessos_cartorio (login_token, cartorio_id, data_expiracao, email_contato, ativo)
VALUES (
  'DEMO-SIPLANSKILLS-CARTORIO',
  '00000000-0000-0000-0000-000000000001',
  '2025-12-31 23:59:59',
  'demo@siplan.com.br',
  true
)
ON CONFLICT (login_token) DO UPDATE SET
  cartorio_id = EXCLUDED.cartorio_id,
  data_expiracao = EXCLUDED.data_expiracao,
  ativo = true;
