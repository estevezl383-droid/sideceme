-- ================================================================================
-- SIDECEME — Seguridad 008: horarios, planillas y cargos sin modificación pública
-- Aplicada el 2026-09-28 como migración "b2_sin_modificacion_publica".
--
-- Desde la v2.9.416, eliminar (marcar inactivo) un horario o una planilla y
-- registrar el titular de la Sección Disciplina pasan por la función Edge
-- registros-ops (service_role), que valida la sesión y el rol. Con la clave
-- pública se podían modificar horarios, planillas y el registro de titulares.
-- Se quitan esos permisos.
-- ================================================================================
revoke update on public.horarios_semanales, public.planillas_disciplina from anon;
revoke insert, update on public.seccion_cargos from anon;
drop policy if exists seccion_cargos_insert on public.seccion_cargos;
drop policy if exists seccion_cargos_update on public.seccion_cargos;
