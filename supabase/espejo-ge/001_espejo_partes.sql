-- ================================================================================
-- MESA DEL EM — ESPEJO EN VIVO DE GOOGLE EARTH: las capas van en su propia tabla
--
-- POR QUÉ: el espejo guardaba sus KML DENTRO de calcos.payload (clave
-- `calcosKml`). Pero el autoguardado de la Mesa (cada 2,5 s) reescribe el
-- payload entero y no trae esa clave: a los pocos segundos de cualquier cambio
-- el espejo quedaba VACÍO, o con una sola capa en el lugar de otra (los enlaces
-- de Google Earth iban por número de orden). Eso era el «no se sincroniza».
--
-- 100% ADITIVO: tabla nueva, RLS activo y SIN políticas (sólo las Edge Functions
-- con service_role la tocan, igual que `calcos`). Se copian las capas que
-- hubieran quedado en los payloads, para que ningún enlace ya abierto se corte.
-- ================================================================================

create table if not exists public.calco_espejo_partes (
  calco_id       uuid        not null references public.calcos(id) on delete cascade,
  clave          text        not null,           -- nombre de la capa en minúsculas y sin acentos: el enlace no cambia
  nombre         text        not null,
  orden          integer     not null default 0,
  kml            text        not null,
  actualizado_en timestamptz not null default now(),
  primary key (calco_id, clave)
);

alter table public.calco_espejo_partes enable row level security;

insert into public.calco_espejo_partes (calco_id, clave, nombre, orden, kml)
select c.id,
       coalesce(nullif(trim(both '-' from regexp_replace(
         translate(lower(coalesce(p->>'nombre', 'capa')), 'áéíóúüñ', 'aeiouun'),
         '[^a-z0-9]+', '-', 'g')), ''), 'capa'),
       coalesce(p->>'nombre', 'Capa'),
       (o - 1)::int,
       p->>'kml'
from public.calcos c,
     jsonb_array_elements(case when jsonb_typeof(c.payload->'calcosKml') = 'array'
                               then c.payload->'calcosKml' else '[]'::jsonb end) with ordinality as t(p, o)
where coalesce(p->>'kml', '') <> ''
on conflict (calco_id, clave) do nothing;
