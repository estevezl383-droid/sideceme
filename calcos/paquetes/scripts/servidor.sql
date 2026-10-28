-- Preparación pendiente de publicar. Solo service_role puede leer las claves.
create table if not exists public.calcos_paquetes (
  id text primary key,
  manifest_sha256 text not null check (manifest_sha256 ~ '^[a-f0-9]{64}$'),
  clave_b64 text not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);
alter table public.calcos_paquetes enable row level security;
revoke all on public.calcos_paquetes from public, anon, authenticated;
grant select, insert, update, delete on public.calcos_paquetes to service_role;
-- Las cuatro claves se cargan desde el registro privado del empaquetador.
-- No incluir ese registro en Git, en los archivos para alumnos ni en capturas.
