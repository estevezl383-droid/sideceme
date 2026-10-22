alter table public.eem_carpetas_clase
 add column escrito_publicado_en timestamptz,
 add column escrito_publicado_por text;
create or replace function public.fn_eem_resultados_escrito(p_carpeta uuid)
returns table(cursante_id text, escrito jsonb)
language sql stable security invoker set search_path='public' as $$
 with criterios as (
 select i.id,i.valor_pct from eem_carpetas_clase c join eem_rubrica_items i on i.rubrica_id=c.rubrica_id
 where c.id=p_carpeta and i.bloque in ('FORMA','FONDO') and i.alcance='grupal'
 ), resultados as (
 select gi.cursante_id,e.id entrega_id,count(n.id) cuantos,sum(n.valor) bruto
 from eem_grupo_integrantes gi
 join eem_entregas e on e.grupo_id=gi.grupo_id and e.vigente and e.estado<>'anulada'
 join eem_entrega_integrantes ei on ei.entrega_id=e.id and ei.cursante_id=gi.cursante_id
 cross join criterios i
 left join eem_notas_item n on n.entrega_id=e.id and n.cursante_id=gi.cursante_id
 and n.carpeta_id=p_carpeta and n.rubrica_item_id=i.id and n.origen not in ('tribunal','deterministico')
 where gi.carpeta_id=p_carpeta group by gi.cursante_id,e.id
 )
 select r.cursante_id,jsonb_build_object('bruta',r.bruto,'nota',b.nota_final,'maximo',(select sum(valor_pct) from criterios),
 'entrega_id',r.entrega_id,'banda_id',bn.id,'publicada',c.escrito_publicado_en is not null,'publicada_en',c.escrito_publicado_en)
 from resultados r join eem_carpetas_clase c on c.id=p_carpeta
 left join eem_bandas_nota bn on bn.carpeta_id=c.id and bn.aplicar_a='texto_65' and bn.activa
 cross join lateral fn_eem_aplicar_banda(r.bruto,(select sum(valor_pct) from criterios),bn.id) b
 where r.cuantos=(select count(*) from criterios) and r.cuantos>0;
$$;
revoke all on function public.fn_eem_resultados_escrito(uuid) from public,anon,authenticated;
grant execute on function public.fn_eem_resultados_escrito(uuid) to service_role;
