-- v2.9.439 — JUEGO DE GUERRA: los MEDIOS de cada unidad (COE y planeamiento del G-4).
-- Va junto con supabase/functions/wargame-ops/index.ts (desplegar la función con --no-verify-jwt, como está hoy).
--
-- `medios` guarda lo que cada unidad trae del Generador de Calcos al importar el escenario:
--   · los sistemas de armas que TIENE (del COE de la biblioteca del profesor o de los datos del G-4), con su
--     cantidad y su dotación en unidades de fuego (la tasa de abastecimiento del Anexo de Logística);
--   · la autonomía planificada (el consumo de combustible por la altura del Anexo);
--   · efectivos, vehículos y armamento del COE, si es un Puesto de Comando, la tarea del CAE y el diseño de su
--     ficha en la Mesa (texto del símbolo, número de la unidad, reducida).
-- El motor la lee al resolver: si una unidad la trae, sus sistemas y su dotación mandan sobre el catálogo; si está
-- vacía (unidades de antes, o colocadas a mano por el árbitro) se usa el catálogo de siempre.
--
-- Sin esta columna la importación NO se corta: la función vuelve a insertar las unidades sin `medios` y avisa.
alter table public.wg_unidades add column if not exists medios jsonb;

comment on column public.wg_unidades.medios is
  'v2.9.439 - Medios de la unidad traidos del Generador de Calcos: sistemas (con cantidad y UF planificadas), autonomia planificada, efectivos, vehiculos y armamento del COE, PC, tarea y diseno de la ficha. Lo lee el motor de wargame-ops.';
