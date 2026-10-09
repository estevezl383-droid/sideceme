-- Las versiones archivadas son inmutables. Publicar selecciona la versión vigente por semana.
create table public.planif_publicaciones (
 semana_id bigint primary key references public.planif_semanas(id),
 consolidado_id bigint not null references public.planif_consolidados(id),
 publicado_por text not null,
 publicado_nombre text not null,
 publicado_en timestamptz not null default now()
);
alter table public.planif_publicaciones enable row level security;
revoke all on public.planif_publicaciones from public,anon,authenticated;
grant all on public.planif_publicaciones to service_role;
alter table public.planif_calendario_enlaces add column propietario_tabla text not null default 'profesores' check (propietario_tabla in ('profesores','cursantes'));
drop index public.planif_calendario_enlaces_propietario_audiencia_idx;
create unique index planif_calendario_enlaces_cuenta_audiencia_idx on public.planif_calendario_enlaces(propietario,propietario_tabla,audiencia) where activo;
alter table public.planif_consolidados drop constraint planif_consolidados_orientacion_check;
alter table public.planif_consolidados add constraint planif_consolidados_orientacion_check check(orientacion in ('portrait','landscape','modelo'));
-- El calendario ya solo expone las versiones expresamente publicadas.
create or replace function public.planif_calendario_consolidado() returns setof public.planif_consolidados
language sql stable security invoker set search_path='' as $$
 select c.* from public.planif_publicaciones p join public.planif_consolidados c on c.id=p.consolidado_id
 join public.planif_semanas s on s.id=p.semana_id where s.activo is not false order by s.fecha_desde
$$;
revoke all on function public.planif_calendario_consolidado() from public,anon,authenticated;
grant execute on function public.planif_calendario_consolidado() to service_role;
