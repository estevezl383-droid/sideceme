-- ================================================================================
-- SIDECEME v2.9.411 — evaluaciones_fisicas SIN LECTURA PÚBLICA
--
-- >>> APLICAR SOLO DESPUÉS de publicar el index.html v2.9.411 o posterior. <<<
-- Desde esa versión la app ya no lee esta tabla directo: cada cursante recibe
-- SOLO sus notas por la Edge Function `efm-ops` (acción mis_evaluaciones, con su
-- sesión), el personal ve la ficha por `evaluaciones_de` y la Sub. Sec. EF su
-- panel por `panel_ef`. Si se aplica antes, las pantallas EFM de la app vieja
-- quedan vacías.
--
-- Después de esto, con la clave pública de la app no se puede leer, crear,
-- modificar ni borrar ninguna nota EFM. Todo pasa por efm-ops (service_role).
-- ================================================================================

drop policy if exists efm_lectura_publicada on public.evaluaciones_fisicas;
revoke select on public.evaluaciones_fisicas from anon, authenticated;
