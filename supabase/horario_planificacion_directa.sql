create or replace function public.planif_prop_guard()
returns trigger language plpgsql as $function$
declare v_aprueba boolean; v_cierre timestamptz;
begin
select coalesce(e.puede_aprobar,false) or coalesce(e.puede_mover,false)
into v_aprueba from public.planif_editores e
where e.profesor_id=new.actualizado_por and e.activo;
v_aprueba:=coalesce(v_aprueba,false);
if not v_aprueba then
if new.semana_id is not null then
v_cierre:=public.planif_cierre(new.semana_id);
if v_cierre is not null and now()>v_cierre then raise exception 'CERRADO: la semana ya no admite cambios de las secciones'; end if;
end if;
if tg_op='UPDATE' and old.semana_id is not null then
v_cierre:=public.planif_cierre(old.semana_id);
if v_cierre is not null and now()>v_cierre then raise exception 'CERRADO: la semana de origen ya no admite cambios de las secciones'; end if;
end if;
if new.estado='aprobada' and (tg_op='INSERT' or old.estado<>'aprobada') then raise exception 'SOLO_APRUEBA: solo el Jefe de Estudios o los editores autorizados aplican cambios'; end if;
end if;
new.actualizado_en:=now();return new;
end $function$;