alter table public.post_ef_organizaciones add column if not exists borrada_en timestamptz;
create table if not exists public.post_ef_borrados (
 id uuid primary key, organizacion_id uuid not null references public.post_ef_organizaciones(id),
 actor_id text not null, actor_nombre text not null, sesion_hash text not null,
 fecha date not null, ciclo text not null, motivo text not null,
 resumen jsonb not null, version integer not null, registros_ids jsonb not null,
 expira_en timestamptz not null default now()+interval '10 minutes', confirmado_en timestamptz
);
alter table public.post_ef_borrados enable row level security;
revoke all on public.post_ef_borrados from public,anon,authenticated;
grant all on public.post_ef_borrados to service_role;
create or replace function public.post_ef_borrar_practica(p_accion text,p_id uuid,p_actor text,p_sesion_hash text,p_organizacion uuid default null,p_motivo text default null,p_confirmacion text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.post_ef_organizaciones; s public.post_ef_borrados; nombre text; ids jsonb; resumen jsonb;
begin
 if p_actor is null or p_actor not in ('P019','P020','P030') then raise exception 'SOLO ORGANIZADORES'; end if;
 select concat_ws(' ',grado,nombre_completo) into nombre from public.profesores where id=p_actor and activo=true;
 if nombre is null or p_sesion_hash is null or length(p_sesion_hash)<>64 then raise exception 'CUENTA NO HABILITADA'; end if;
 if p_accion not in ('preparar_borrado','confirmar_borrado') or p_accion is null then raise exception 'ACCIÓN NO VÁLIDA'; end if;
 if p_accion='confirmar_borrado' then
  select * into s from public.post_ef_borrados where id=p_id for update;
  if s.id is null or s.actor_id<>p_actor or s.sesion_hash<>p_sesion_hash or p_confirmacion is distinct from 'BORRAR' then raise exception 'CONFIRMACIÓN NO VÁLIDA'; end if;
  if s.confirmado_en is not null then return jsonb_build_object('ok',true,'borrado',to_jsonb(s)-'sesion_hash'-'registros_ids'); end if;
  if s.expira_en<now() then raise exception 'SOLICITUD VENCIDA. VUELVA A INICIAR EL BORRADO'; end if;
  p_organizacion:=s.organizacion_id;
 end if;
 select * into p from public.post_ef_organizaciones where id=p_organizacion for update;
 if p.id is null or p.modo<>'PILOTO' or p.borrada_en is not null then raise exception 'SOLO SE BORRAN PRÁCTICAS ACTIVAS'; end if;
 select coalesce(jsonb_agg(id order by id),'[]'::jsonb),jsonb_build_object('nombre',p.nombre,'alumnos',count(distinct postulante_id),'registros',count(distinct (postulante_id,prueba)),'revisiones',count(*)) into ids,resumen from public.post_ef_registros where organizacion_id=p.id;
 if exists(select 1 from public.post_ef_registros where organizacion_id=p.id and modo<>'PRUEBA') then raise exception 'CONTIENE REGISTROS OFICIALES'; end if;
 if p_accion='preparar_borrado' then
  if p_motivo is null or length(trim(p_motivo)) not between 10 and 600 then raise exception 'INDIQUE UN MOTIVO DE 10 A 600 CARACTERES'; end if;
  insert into public.post_ef_borrados(id,organizacion_id,actor_id,actor_nombre,sesion_hash,fecha,ciclo,motivo,resumen,version,registros_ids)
  values(p_id,p.id,p_actor,nombre,p_sesion_hash,p.fecha,p.ciclo,trim(p_motivo),resumen,p.version,ids) on conflict(id) do nothing;
  select * into s from public.post_ef_borrados where id=p_id;
  if s.actor_id<>p_actor or s.sesion_hash<>p_sesion_hash or s.organizacion_id<>p.id or s.motivo<>trim(p_motivo) then raise exception 'SOLICITUD EN CONFLICTO'; end if;
  return jsonb_build_object('ok',true,'solicitud',to_jsonb(s)-'sesion_hash'-'registros_ids');
 end if;
 if s.version<>p.version or s.registros_ids<>ids then raise exception 'LA PRÁCTICA CAMBIÓ. VUELVA A INICIAR EL BORRADO'; end if;
 update public.post_ef_organizaciones set borrada_en=now(),habilitado=false,version=version+1,actualizado_en=now(),actor_id=p_actor where id=p.id;
 update public.post_ef_borrados set confirmado_en=now() where id=s.id returning * into s;
 return jsonb_build_object('ok',true,'borrado',to_jsonb(s)-'sesion_hash'-'registros_ids');
end $$;
revoke all on function public.post_ef_borrar_practica(text,uuid,text,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.post_ef_borrar_practica(text,uuid,text,text,uuid,text,text) to service_role;
-- Serializa registros con el borrado y evita reactivar una práctica archivada.
create or replace function public.post_ef_proteger_borrado() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_TABLE_NAME='post_ef_organizaciones' then
  if old.borrada_en is not null then raise exception 'PRÁCTICA BORRADA'; end if;
 else
  perform 1 from public.post_ef_organizaciones where id=new.organizacion_id and borrada_en is null for update;
  if not found then raise exception 'PRÁCTICA BORRADA'; end if;
 end if;
 return new;
end $$;
revoke all on function public.post_ef_proteger_borrado() from public,anon,authenticated;
grant execute on function public.post_ef_proteger_borrado() to service_role;
create trigger post_ef_borrado_organizacion before update on public.post_ef_organizaciones for each row execute function public.post_ef_proteger_borrado();
create trigger post_ef_borrado_registro before insert or update on public.post_ef_registros for each row execute function public.post_ef_proteger_borrado();
create trigger post_ef_borrado_condicion before insert or update on public.post_ef_condiciones for each row execute function public.post_ef_proteger_borrado();
