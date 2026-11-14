alter table public.post_ef_organizaciones add column if not exists practica_hasta date;
alter table public.post_ef_organizaciones add column if not exists origen_id uuid references public.post_ef_organizaciones(id);
create or replace function public.post_ef_reiniciar_practica(p_id uuid,p_version integer,p_nuevo uuid,p_actor text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare anterior public.post_ef_organizaciones; nuevo public.post_ef_organizaciones;
begin
 if p_actor not in ('P019','P020','P030') or not exists(select 1 from public.profesores where id=p_actor and activo=true) then raise exception 'SOLO ORGANIZADORES'; end if;
 select * into anterior from public.post_ef_organizaciones where id=p_id for update;
 if anterior.id is null or anterior.modo<>'PILOTO' then raise exception 'SOLO SE REINICIAN PRÁCTICAS'; end if;
 select * into nuevo from public.post_ef_organizaciones where id=p_nuevo;
 if nuevo.id is not null then
  if nuevo.origen_id=p_id and nuevo.actor_id=p_actor then return to_jsonb(nuevo); end if;
  raise exception 'IDENTIFICADOR EN CONFLICTO';
 end if;
 if anterior.version<>p_version or not anterior.habilitado then raise exception 'RECARGUE LA ORGANIZACIÓN'; end if;
 if anterior.practica_hasta is not null and (current_timestamp at time zone 'America/La_Paz')::date>anterior.practica_hasta then raise exception 'EL PERÍODO DE PRÁCTICA FINALIZÓ'; end if;
 update public.post_ef_organizaciones set habilitado=false,version=version+1,actor_id=p_actor,actualizado_en=now() where id=p_id;
 insert into public.post_ef_organizaciones(id,nombre,fecha,ciclo,modo,habilitado,grupos,version,actor_id,actualizado_en,practica_hasta,origen_id)
 values(p_nuevo,anterior.nombre,anterior.fecha,anterior.ciclo,'PILOTO',true,anterior.grupos,1,p_actor,now(),anterior.practica_hasta,p_id) returning * into nuevo;
 return to_jsonb(nuevo);
end $$;
revoke all on function public.post_ef_reiniciar_practica(uuid,integer,uuid,text) from public,anon,authenticated;
grant execute on function public.post_ef_reiniciar_practica(uuid,integer,uuid,text) to service_role;
