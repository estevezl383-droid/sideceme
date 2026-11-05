-- Borrado lógico de sesiones de prueba: los registros originales permanecen inmutables.
create table public.efmc_historial_borrados (
 id uuid primary key,
 organizacion_id uuid references public.efmc_organizaciones(id),
 fecha date not null,
 ciclo text not null check(ciclo in ('1ER CICLO','2DO CICLO')),
 actor_id text not null references public.profesores(id),
 actor_nombre text not null,
 sesion_hash text not null check(sesion_hash ~ '^[a-f0-9]{64}$'),
 motivo text not null check(char_length(motivo) between 10 and 600),
 registros_ids uuid[] not null check(cardinality(registros_ids)>0),
 resumen jsonb not null,
 preparado_en timestamptz not null default clock_timestamp(),
 expira_en timestamptz not null default (clock_timestamp()+interval '10 minutes'),
 confirmado_en timestamptz,
 estado text generated always as (case when confirmado_en is null then 'PREPARADA' else 'BORRADA' end) stored
);
alter table public.efmc_historial_borrados enable row level security;
revoke all on public.efmc_historial_borrados from public,anon,authenticated,service_role;
grant select,insert on public.efmc_historial_borrados to service_role;
grant update(confirmado_en) on public.efmc_historial_borrados to service_role;
create index efmc_borrados_registros on public.efmc_historial_borrados using gin(registros_ids) where confirmado_en is not null;
create index efmc_borrados_fecha on public.efmc_historial_borrados(confirmado_en desc) where confirmado_en is not null;

create function public.efmc_proteger_borrado() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='DELETE' then raise exception 'EL REGISTRO DE BORRADO ES INMUTABLE'; end if;
 if old.confirmado_en is not null or new.confirmado_en is null or
    (to_jsonb(new)-'confirmado_en'-'estado') is distinct from (to_jsonb(old)-'confirmado_en'-'estado') then
  raise exception 'SÓLO SE PUEDE CONFIRMAR UNA SOLICITUD DE BORRADO UNA VEZ';
 end if;
 return new;
end $$;
revoke all on function public.efmc_proteger_borrado() from public,anon,authenticated;
create trigger efmc_borrado_inmutable before update or delete on public.efmc_historial_borrados for each row execute function public.efmc_proteger_borrado();

create function public.efmc_candidatos_borrado(p_organizacion uuid,p_fecha date,p_ciclo text)
returns table(id uuid,cursante_id text,prueba text) language sql stable security invoker set search_path='' as $$
 select r.id,r.cursante_id,r.prueba from public.efmc_registros r
 join public.cursantes c on c.id=r.cursante_id
 left join public.efmc_organizaciones o on o.id=r.organizacion_id
 where r.modo='PRUEBA' and r.fecha=p_fecha
 and coalesce(nullif(r.calculo->>'ciclo',''),o.ciclo,c.ciclo)=p_ciclo
 and ((p_organizacion is null and r.organizacion_id is null) or
      (r.organizacion_id=p_organizacion and o.modo='PILOTO' and o.publicada_en is null))
 and not exists(select 1 from public.efmc_historial_borrados b where b.confirmado_en is not null and b.registros_ids @> array[r.id]);
$$;
revoke all on function public.efmc_candidatos_borrado(uuid,date,text) from public,anon,authenticated;
grant execute on function public.efmc_candidatos_borrado(uuid,date,text) to service_role;

create function public.efmc_preparar_borrado(p_id uuid,p_actor text,p_sesion_hash text,p_organizacion uuid,p_fecha date,p_ciclo text,p_motivo text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 actor_nombre text; titulo text:='Prueba personal sin grupos'; ids uuid[]; alumnos bigint; pruebas bigint; revisiones bigint;
 org public.efmc_organizaciones%rowtype; solicitud public.efmc_historial_borrados%rowtype;
begin
 if p_actor is null or p_actor not in ('P019','P020','P030') then return jsonb_build_object('ok',false,'status',403,'error','SÓLO LOS JEFES PUEDEN BORRAR PRUEBAS'); end if;
 select concat_ws(' ',p.grado,p.nombre_completo) into actor_nombre from public.profesores p where p.id=p_actor and p.activo=true;
 if actor_nombre is null then return jsonb_build_object('ok',false,'status',403,'error','CUENTA NO HABILITADA'); end if;
 if p_id is null or p_sesion_hash is null or p_sesion_hash !~ '^[a-f0-9]{64}$' or p_fecha is null or p_ciclo is null or p_ciclo not in ('1ER CICLO','2DO CICLO') or p_motivo is null or char_length(btrim(p_motivo)) not between 10 and 600 then
  return jsonb_build_object('ok',false,'status',400,'error','INDICÁ LA SESIÓN Y UN MOTIVO DE 10 A 600 CARACTERES');
 end if;
 perform pg_advisory_xact_lock(hashtextextended(concat_ws(':','efmc-borrar',coalesce(p_organizacion::text,'personal'),p_fecha::text,p_ciclo),0));
 if p_organizacion is not null then
  select * into org from public.efmc_organizaciones where id=p_organizacion for share;
  if not found or org.modo<>'PILOTO' or org.publicada_en is not null or org.fecha<>p_fecha or org.ciclo<>p_ciclo then
   return jsonb_build_object('ok',false,'status',403,'error','SÓLO SE PUEDEN BORRAR SESIONES DE PRUEBA. LAS EVALUACIONES REGISTRADAS ESTÁN PROTEGIDAS');
  end if;
  titulo:=org.nombre;
 end if;
 select * into solicitud from public.efmc_historial_borrados where id=p_id;
 if found then
  if solicitud.actor_id<>p_actor or solicitud.sesion_hash<>p_sesion_hash or solicitud.organizacion_id is distinct from p_organizacion or solicitud.fecha<>p_fecha or solicitud.ciclo<>p_ciclo or solicitud.motivo<>btrim(p_motivo) then
   return jsonb_build_object('ok',false,'status',409,'error','IDENTIFICADOR DE SOLICITUD EN CONFLICTO');
  end if;
  return jsonb_build_object('ok',true,'solicitud',to_jsonb(solicitud)-'sesion_hash'-'registros_ids');
 end if;
 select array_agg(x.id order by x.id),count(distinct x.cursante_id),count(distinct (x.cursante_id,x.prueba)),count(*) into ids,alumnos,pruebas,revisiones from public.efmc_candidatos_borrado(p_organizacion,p_fecha,p_ciclo) x;
 if ids is null then return jsonb_build_object('ok',false,'status',409,'error','LA SESIÓN YA NO TIENE REGISTROS DE PRUEBA ACTIVOS'); end if;
 if exists(select 1 from public.efmc_conformidades where registro_id=any(ids)) then return jsonb_build_object('ok',false,'status',403,'error','UNA SESIÓN CON CONFORMIDADES NO SE PUEDE BORRAR COMO PRUEBA'); end if;
 insert into public.efmc_historial_borrados(id,organizacion_id,fecha,ciclo,actor_id,actor_nombre,sesion_hash,motivo,registros_ids,resumen)
 values(p_id,p_organizacion,p_fecha,p_ciclo,p_actor,actor_nombre,p_sesion_hash,btrim(p_motivo),ids,jsonb_build_object('nombre',titulo,'alumnos',alumnos,'registros',pruebas,'revisiones',revisiones)) returning * into solicitud;
 return jsonb_build_object('ok',true,'solicitud',to_jsonb(solicitud)-'sesion_hash'-'registros_ids');
end $$;
revoke all on function public.efmc_preparar_borrado(uuid,text,text,uuid,date,text,text) from public,anon,authenticated;
grant execute on function public.efmc_preparar_borrado(uuid,text,text,uuid,date,text,text) to service_role;

create function public.efmc_confirmar_borrado(p_id uuid,p_actor text,p_sesion_hash text,p_confirmacion text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare solicitud public.efmc_historial_borrados%rowtype; ids uuid[];
begin
 if p_actor is null or p_actor not in ('P019','P020','P030') or not exists(select 1 from public.profesores where id=p_actor and activo=true) then return jsonb_build_object('ok',false,'status',403,'error','CUENTA NO HABILITADA'); end if;
 if p_confirmacion is distinct from 'BORRAR' then return jsonb_build_object('ok',false,'status',400,'error','ESCRIBÍ BORRAR PARA LA SEGUNDA CONFIRMACIÓN'); end if;
 select * into solicitud from public.efmc_historial_borrados where id=p_id for update;
 if not found or solicitud.actor_id<>p_actor or p_sesion_hash is null or solicitud.sesion_hash<>p_sesion_hash then return jsonb_build_object('ok',false,'status',403,'error','LA SOLICITUD NO CORRESPONDE A TU SESIÓN'); end if;
 if solicitud.confirmado_en is not null then return jsonb_build_object('ok',true,'borrado',to_jsonb(solicitud)-'sesion_hash'-'registros_ids'); end if;
 if solicitud.expira_en<=clock_timestamp() then return jsonb_build_object('ok',false,'status',409,'error','LA SOLICITUD VENCIÓ. INICIÁ DE NUEVO LA DOBLE CONFIRMACIÓN'); end if;
 perform pg_advisory_xact_lock(hashtextextended(concat_ws(':','efmc-borrar',coalesce(solicitud.organizacion_id::text,'personal'),solicitud.fecha::text,solicitud.ciclo),0));
 if solicitud.organizacion_id is not null and not exists(select 1 from public.efmc_organizaciones where id=solicitud.organizacion_id and modo='PILOTO' and publicada_en is null) then return jsonb_build_object('ok',false,'status',403,'error','LA ORGANIZACIÓN YA NO ES UNA PRUEBA BORRABLE'); end if;
 select array_agg(x.id order by x.id) into ids from public.efmc_candidatos_borrado(solicitud.organizacion_id,solicitud.fecha,solicitud.ciclo) x;
 if ids is distinct from solicitud.registros_ids or exists(select 1 from public.efmc_conformidades where registro_id=any(ids)) then return jsonb_build_object('ok',false,'status',409,'error','LA SESIÓN CAMBIÓ. REVISÁ SUS REGISTROS Y REPETÍ LAS DOS CONFIRMACIONES'); end if;
 update public.efmc_historial_borrados set confirmado_en=clock_timestamp() where id=p_id returning * into solicitud;
 return jsonb_build_object('ok',true,'borrado',to_jsonb(solicitud)-'sesion_hash'-'registros_ids');
end $$;
revoke all on function public.efmc_confirmar_borrado(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.efmc_confirmar_borrado(uuid,text,text,text) to service_role;
