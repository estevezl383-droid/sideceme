begin;
create table public.efmc_organizaciones (
 id uuid primary key, nombre text not null, fecha date not null, ciclo text not null check(ciclo in ('1ER CICLO','2DO CICLO')),
 modo text not null check(modo in ('PILOTO','EVALUACION')), habilitado boolean not null default false,
 grupos jsonb not null check(jsonb_typeof(grupos)='array'), version integer not null default 1,
 actor_id text not null references public.profesores(id), actualizado_en timestamptz not null default now()
);
create table public.efmc_organizacion_historial (
 id bigint generated always as identity primary key, organizacion_id uuid not null references public.efmc_organizaciones(id),
 version integer not null, snapshot jsonb not null, creado_en timestamptz not null default now()
);
create table public.efmc_condiciones (
 id uuid primary key, organizacion_id uuid not null references public.efmc_organizaciones(id),
 cursante_id text not null references public.cursantes(id), prueba text not null,
 estado text not null check(estado in ('NORMAL','CON_PAPELETA','SIN_PAPELETA','NO_ASISTIO')),
 observacion text not null default '', referencia text not null default '', actor_id text not null references public.profesores(id),
 creado_en timestamptz not null default now()
);
alter table public.efmc_organizaciones enable row level security;
alter table public.efmc_organizacion_historial enable row level security;
alter table public.efmc_condiciones enable row level security;
revoke all on public.efmc_organizaciones,public.efmc_organizacion_historial,public.efmc_condiciones from public,anon,authenticated;
grant all on public.efmc_organizaciones,public.efmc_organizacion_historial,public.efmc_condiciones to service_role;
grant usage,select on sequence public.efmc_organizacion_historial_id_seq to service_role;
create function public.efmc_auditar_organizacion() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 insert into public.efmc_organizacion_historial(organizacion_id,version,snapshot) values(new.id,new.version,to_jsonb(new));return new;
end $$;
revoke all on function public.efmc_auditar_organizacion() from public,anon,authenticated;
grant execute on function public.efmc_auditar_organizacion() to service_role;
create trigger efmc_organizacion_audit after insert or update on public.efmc_organizaciones for each row execute function public.efmc_auditar_organizacion();
alter table public.efmc_registros drop constraint efmc_registros_actor_id_check;
alter table public.efmc_registros add constraint efmc_registros_actor_fkey foreign key(actor_id) references public.profesores(id);
alter table public.efmc_registros add column organizacion_id uuid references public.efmc_organizaciones(id);
create index efmc_organizacion_fecha on public.efmc_organizaciones(fecha);
create index efmc_condiciones_busqueda on public.efmc_condiciones(organizacion_id,cursante_id,creado_en desc);
create index efmc_registros_organizacion on public.efmc_registros(organizacion_id,fecha);
commit;
