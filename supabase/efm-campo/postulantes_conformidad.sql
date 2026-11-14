create table if not exists public.post_ef_conformidades(
 registro_id uuid not null references public.post_ef_registros(id), postulante_id uuid not null references public.post_postulantes(id),
 simulada boolean not null default false,actor text not null,confirmado_en timestamptz not null default now(),primary key(registro_id,simulada)
);
alter table public.post_ef_conformidades enable row level security;
revoke all on public.post_ef_conformidades from anon,authenticated;
grant select,insert on public.post_ef_conformidades to service_role;
create or replace function public.post_ef_confirmar(p_registro uuid,p_postulante uuid,p_simulada boolean,p_actor text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare r public.post_ef_registros; p public.post_ef_organizaciones;
begin
 select * into r from public.post_ef_registros where id=p_registro and postulante_id=p_postulante;
 if r.id is null then raise exception 'REGISTRO AJENO AL POSTULANTE'; end if;
 select * into p from public.post_ef_organizaciones where id=r.organizacion_id for share;
 if not p.habilitado or not exists(select 1 from jsonb_array_elements(p.grupos) g where g->'alumnos' @> to_jsonb(array[p_postulante::text])) then raise exception 'ORGANIZACIÓN NO HABILITADA'; end if;
 if p_simulada then
  if p_actor<>'P030' or p.modo<>'PILOTO' then raise exception 'LA SIMULACIÓN SOLO CONFIRMA PRÁCTICAS'; end if;
 else
  if p_actor<>'POST:'||p_postulante::text then raise exception 'LA CONFORMIDAD CORRESPONDE AL POSTULANTE'; end if;
 end if;
 if exists(select 1 from public.post_ef_registros where organizacion_id=r.organizacion_id and postulante_id=p_postulante and prueba=r.prueba and revision>r.revision) then raise exception 'LA NOTA CAMBIÓ. ACTUALICE ANTES DE CONFIRMAR'; end if;
 insert into public.post_ef_conformidades(registro_id,postulante_id,simulada,actor) values(r.id,p_postulante,p_simulada,p_actor) on conflict do nothing;
 return true;
end $$;
revoke all on function public.post_ef_confirmar(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.post_ef_confirmar(uuid,uuid,boolean,text) to service_role;
