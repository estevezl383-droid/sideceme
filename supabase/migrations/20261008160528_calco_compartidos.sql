-- Envíos separados del payload: distribuir nunca pisa el trabajo del alumno.
create table public.calco_compartidos (
  id uuid primary key default gen_random_uuid(),
  origen_calco_id uuid references public.calcos(id) on delete set null,
  destino_calco_id uuid references public.calcos(id) on delete cascade,
  destino_grupo_id text references public.ejercicio_grupos(id) on delete cascade,
  destino_ejercicio_id text references public.ejercicios(id) on delete cascade,
  nombre text not null check (length(nombre) between 1 and 160),
  paquete jsonb not null check (octet_length(paquete::text) <= 2100000),
  creado_por text not null,
  enviado_por text not null,
  creado_en timestamptz not null default now(),
  check ((destino_calco_id is not null and destino_grupo_id is null and destino_ejercicio_id is null)
      or (destino_calco_id is null and destino_grupo_id is not null and destino_ejercicio_id is not null))
);
create index calco_compartidos_personal_idx on public.calco_compartidos(destino_calco_id,creado_en desc);
create index calco_compartidos_grupo_idx on public.calco_compartidos(destino_grupo_id,destino_ejercicio_id,creado_en desc);
alter table public.calco_compartidos enable row level security;
revoke all on public.calco_compartidos from anon, authenticated;
grant select,insert,update,delete on public.calco_compartidos to service_role;
-- Exclusiones confirmadas: evita que una pestaña antigua vuelva a guardar datos ajenos.
create table public.calco_blancos_excluidos (
  calco_id uuid not null references public.calcos(id) on delete cascade,
  blanco_id text not null,
  motivo text not null,
  creado_en timestamptz not null default now(),
  primary key (calco_id,blanco_id)
);
alter table public.calco_blancos_excluidos enable row level security;
revoke all on public.calco_blancos_excluidos from anon,authenticated;
grant select,insert,update,delete on public.calco_blancos_excluidos to service_role;
create function public.calco_filtrar_blancos_excluidos() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if exists (select 1 from public.calco_blancos_excluidos where calco_id=new.id)
     and jsonb_typeof(new.payload #> '{planFuegos,blancos}')='array' then
    new.payload := jsonb_set(new.payload,'{planFuegos,blancos}',
      coalesce((select jsonb_agg(b.value order by b.ordinality)
        from jsonb_array_elements(new.payload #> '{planFuegos,blancos}') with ordinality as b(value,ordinality)
        where not exists (select 1 from public.calco_blancos_excluidos e
          where e.calco_id=new.id and e.blanco_id=b.value->>'id')), '[]'::jsonb));
  end if;
  return new;
end;
$$;
revoke all on function public.calco_filtrar_blancos_excluidos() from public,anon,authenticated;
grant execute on function public.calco_filtrar_blancos_excluidos() to service_role;
create trigger calco_filtrar_blancos_excluidos before update of payload on public.calcos
for each row execute function public.calco_filtrar_blancos_excluidos();
