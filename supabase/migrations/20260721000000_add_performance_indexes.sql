-- Índices de performance para telas de reservas e chat.
-- Diagnóstico: clientes (35k linhas), compelition (12k) e reservas (3k) só
-- tinham índice na PK. Buscas por chatId/telefone/empresa varriam a tabela
-- inteira (~108ms cada), rodando milhares de vezes pelo orquestrador e
-- saturando o pool — o que deixava até as queries rápidas do dashboard na fila.
--
-- Ganhos medidos (EXPLAIN ANALYZE em produção):
--   busca de cliente por chatId/telefone: 108ms -> 0,18ms
--   lista de conversas (compelition):      692ms -> 2,1ms
--   reservas de hoje:                        48ms -> 0,1ms
--
-- CONCURRENTLY para não travar escrita em produção durante a criação.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_chatid
  ON public.clientes ("chatId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_telefone
  ON public.clientes (telefone);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_empresa_id
  ON public.clientes (empresa_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_compelition_empresa_mod
  ON public.compelition (empresa, "modificadoEm" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservas_empresa_data
  ON public.reservas (empresa_id, data_reserva);
