-- RPC conversas_recentes: extrai a ultima mensagem de cada conversa no banco.
-- Antes o app baixava o chat inteiro (JSONB) das 50 conversas mais recentes
-- (~154kB) so para exibir o preview da ultima mensagem. Agora trafega ~5kB.

create or replace function public.conversas_recentes(p_empresa_id bigint)
returns table (
  compelition_id bigint,
  cliente_id bigint,
  nome text,
  "chatId" text,
  telefone text,
  instancia text,
  ultima_mensagem text,
  ultimo_role text,
  "modificadoEm" timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id                                as compelition_id,
    cl.id                               as cliente_id,
    coalesce(cl.nome, 'Desconhecido')   as nome,
    coalesce(cl."chatId", '')           as "chatId",
    coalesce(cl.telefone, '')           as telefone,
    coalesce(cl.instancia, '')          as instancia,
    regexp_replace(
      coalesce(c.chat -> (jsonb_array_length(c.chat) - 1) ->> 'content', ''),
      '<data>.*?</data>\s*', '', 'g'
    )                                   as ultima_mensagem,
    coalesce(c.chat -> (jsonb_array_length(c.chat) - 1) ->> 'role', '') as ultimo_role,
    c."modificadoEm"
  from public.compelition c
  left join public.clientes cl on cl.id = c.cliente
  where c.empresa = p_empresa_id
    and c.chat is not null
    and jsonb_array_length(c.chat) > 0
  order by c."modificadoEm" desc
  limit 50;
$$;

grant execute on function public.conversas_recentes(bigint) to anon, authenticated, service_role;
