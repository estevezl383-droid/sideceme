-- ================================================================================
-- SIDECEME v2.9.410 — CIERRE DE ACCESO A evaluaciones_fisicas
--
-- Antes: una sola política `anon_all` (FOR ALL, USING true, WITH CHECK true) y
-- una columna `password` con la CI de cada cursante en texto plano.
--
-- Después:
--   * anon/authenticated solo LEEN, y solo filas publicadas o históricas
--     (publicado IS DISTINCT FROM false). Los borradores de la Sub. Sec. EF
--     quedan invisibles fuera de la Edge Function `efm-ops`.
--   * Nadie con la clave pública puede insertar, modificar, borrar ni truncar.
--     Las escrituras van solo por `efm-ops` (service_role, que salta RLS).
--   * `password` queda en NULL: nadie la usa (auth-login lee `cursantes` y
--     `profesores`, nunca esta tabla) y los 224 valores eran copia exacta de la
--     columna `ci` de la misma fila, así que no se pierde información.
--     La columna NO se borra: eso queda a decisión del dueño.
-- ================================================================================

update public.evaluaciones_fisicas set password = null where password is not null;

drop policy if exists anon_all on public.evaluaciones_fisicas;

create policy efm_lectura_publicada on public.evaluaciones_fisicas
  for select to anon, authenticated
  using (publicado is distinct from false);

revoke insert, update, delete, truncate, references, trigger
  on public.evaluaciones_fisicas from anon, authenticated;
