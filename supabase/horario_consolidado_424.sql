-- Archivo independiente: nunca modifica el horario base ni sus propuestas.
create table public.planif_consolidados (
 id bigint generated always as identity primary key,
 semana_id bigint not null references public.planif_semanas(id),
 creado_por text not null, creado_nombre text not null,
 creado_en timestamptz not null default now(),
 orientacion text not null check(orientacion in ('portrait','landscape')),
 datos jsonb not null, fuente jsonb not null
);
create index on public.planif_consolidados(semana_id,id desc);
create table public.planif_calendario_enlaces (
 id bigint generated always as identity primary key,
 propietario text not null,
 audiencia text not null check(audiencia in ('planta','c1','c2')),
 token text not null unique default replace(gen_random_uuid()::text||gen_random_uuid()::text,'-',''),
 activo boolean not null default true,
 creado_en timestamptz not null default now()
);
create unique index on public.planif_calendario_enlaces(propietario,audiencia) where activo;
alter table public.planif_consolidados enable row level security;
alter table public.planif_calendario_enlaces enable row level security;
revoke all on public.planif_consolidados,public.planif_calendario_enlaces from public,anon,authenticated;
grant all on public.planif_consolidados,public.planif_calendario_enlaces to service_role;
grant usage,select on sequence public.planif_consolidados_id_seq,public.planif_calendario_enlaces_id_seq to service_role;
create function public.planif_fuente_consolidada(p_semana bigint) returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('semana',to_jsonb(s),'propuestas',coalesce((
 select jsonb_agg(to_jsonb(p) order by p.fecha,p.desde,p.id) from public.planif_propuestas p
 where p.fecha between s.fecha_desde and s.fecha_hasta),'[]'::jsonb))
 from public.planif_semanas s where s.id=p_semana and s.activo is not false
$$;
create function public.planif_calendario_consolidado() returns setof public.planif_consolidados
language sql stable security invoker set search_path='' as $$
 select distinct on (c.semana_id) c.* from public.planif_consolidados c
 join public.planif_semanas s on s.id=c.semana_id where s.activo is not false
 order by c.semana_id,c.id desc
$$;
revoke all on function public.planif_fuente_consolidada(bigint),public.planif_calendario_consolidado() from public,anon,authenticated;
grant execute on function public.planif_fuente_consolidada(bigint),public.planif_calendario_consolidado() to service_role;
