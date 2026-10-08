-- v2.9.430 — JUEGO DE GUERRA: cerrojo del turno y una sola orden por unidad.
-- Va junto con supabase/functions/wargame-ops/index.ts (desplegar la función
-- con --no-verify-jwt, como está hoy).
--
-- 1) Cerrojo de resolución: `resolver_turno` reclama el turno con un UPDATE
--    condicional sobre esta columna; dos pantallas apretando «Jugar turno» a la
--    vez ya no resuelven el mismo turno dos veces.
alter table public.wg_partidas add column if not exists resolviendo_desde timestamptz;

-- 2) Una orden por unidad y turno. Primero se limpian las repetidas que dejó el
--    doble envío (se conserva la más nueva), después se pone la clave única
--    sobre la que hace upsert `enviar_orden`.
delete from public.wg_ordenes o
 using public.wg_ordenes o2
 where o.partida_id = o2.partida_id and o.turno = o2.turno
   and o.unidad_id = o2.unidad_id and o.id < o2.id;
create unique index if not exists wg_ordenes_unica_por_turno
  on public.wg_ordenes (partida_id, turno, unidad_id);
