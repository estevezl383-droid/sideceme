-- Piloto exclusivo P030. Ninguna escritura en evaluaciones_fisicas.
create table public.efmc_perfiles (
 cursante_id text primary key references public.cursantes(id),
 fecha_nacimiento date, sexo text check(sexo in ('M','F')),
 foto_path text, fuente text, actualizado_en timestamptz not null default now()
);
alter table public.efmc_perfiles enable row level security;
revoke all on public.efmc_perfiles from anon,authenticated;
create table public.efmc_registros (
 id uuid primary key,
 cursante_id text not null references public.cursantes(id),
 prueba text not null check(prueba in ('flexiones','abdominales','aerobica','natacion','barras')),
 fecha date not null, valor numeric not null check(valor>=0 and valor<=10000),
 sexo text check(sexo in ('M','F')), nacimiento date,
 calculo jsonb not null, actor_id text not null check(actor_id='P030'),
 modo text not null default 'PRUEBA' check(modo='PRUEBA'),
 creado_en timestamptz not null default now()
);
alter table public.efmc_registros enable row level security;
revoke all on public.efmc_registros from anon,authenticated;
create index efmc_registros_lectura on public.efmc_registros(fecha,cursante_id,creado_en desc);
