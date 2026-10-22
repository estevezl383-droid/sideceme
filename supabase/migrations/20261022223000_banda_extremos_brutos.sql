-- Extremos explícitos y versionados para normalización de una cohorte.
-- NULL conserva el comportamiento histórico 0..tope; no cambia otras carpetas.
alter table public.eem_bandas_nota
 add column bruta_minima numeric,
 add column bruta_maxima numeric,
 add constraint eem_banda_extremos_validos check (
 (bruta_minima is null and bruta_maxima is null) or
 (bruta_minima is not null and bruta_maxima is not null and
 bruta_minima >= 0 and bruta_maxima > bruta_minima and modo='reescalado'));

create or replace function public.fn_eem_aplicar_banda(p_nota_bruta numeric,p_tope_bruto numeric,p_banda_id uuid)
returns table(nota_bruta numeric,nota_final numeric,modo text,advertencia text)
language plpgsql stable set search_path to 'public' as $function$
declare b record; v_final numeric; v_desde numeric; v_hasta numeric;
begin
 nota_bruta:=round(coalesce(p_nota_bruta,0),4);
 if p_banda_id is null then
  return query select nota_bruta,nota_bruta,'sin_banda'::text,null::text; return;
 end if;
 select * into b from eem_bandas_nota where id=p_banda_id;
 if not found then
  return query select nota_bruta,nota_bruta,'sin_banda'::text,'La banda indicada no existe; se devuelve la nota bruta.'::text; return;
 end if;
 if b.modo='reescalado' then
  v_desde:=coalesce(b.bruta_minima,0); v_hasta:=coalesce(b.bruta_maxima,p_tope_bruto);
  if b.bruta_maxima is not null and b.bruta_maxima>p_tope_bruto then
   raise exception 'El extremo bruto supera el máximo de la rúbrica.';
  end if;
  if coalesce(v_hasta-v_desde,0)<=0 then v_final:=nota_bruta;
  else
   v_final:=b.nota_minima+(nota_bruta-v_desde)/(v_hasta-v_desde)*(b.nota_maxima-b.nota_minima);
   v_final:=least(greatest(v_final,b.nota_minima),b.nota_maxima);
  end if;
  return query select nota_bruta,round(v_final,4),b.modo,null::text;
 else
  v_final:=least(greatest(nota_bruta,b.nota_minima),b.nota_maxima);
  return query select nota_bruta,round(v_final,4),b.modo,
   ('ATENCION: el modo TRUNCADO aplasta en un mismo valor a todos los que quedan fuera de la banda '
    ||b.nota_minima::text||' - '||b.nota_maxima::text||' y genera empates que destruyen la antiguedad.')::text;
 end if;
end $function$;

create or replace function public.fn_eem_banda_inmutable()
returns trigger language plpgsql set search_path to 'public' as $function$
begin
 if new.nota_minima is distinct from old.nota_minima
 or new.nota_maxima is distinct from old.nota_maxima
 or new.modo is distinct from old.modo
 or new.aplicar_a is distinct from old.aplicar_a
 or new.carpeta_id is distinct from old.carpeta_id
 or new.bruta_minima is distinct from old.bruta_minima
 or new.bruta_maxima is distinct from old.bruta_maxima then
  raise exception 'EEM: una banda de notas NO se edita. Cree una version nueva.' using errcode='restrict_violation';
 end if;
 return new;
end $function$;
